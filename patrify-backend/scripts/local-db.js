#!/usr/bin/env node
/* eslint-disable no-console */

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const action = process.argv[2] || 'start';
const port = Number(process.env.PATRIFY_DB_PORT || 27017);

const repoRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.join(repoRoot, '.mongodata');
const logFile = path.join(dataDir, 'mongod.log');
const pidFile = path.join(dataDir, 'mongod.pid');
const isWindows = process.platform === 'win32';

function findMongodBin() {
  const binName = isWindows ? 'mongod.exe' : 'mongod';
  const searchDirs = [
    ...(process.env.PATH || '').split(path.delimiter),
    ...(isWindows ? [] : ['/usr/local/bin', '/opt/homebrew/bin', '/usr/bin'])
  ];

  for (const dir of searchDirs) {
    if (dir && fs.existsSync(path.join(dir, binName))) {
      return path.join(dir, binName);
    }
  }

  if (isWindows) {
    const mongoRoot = 'C:\\Program Files\\MongoDB\\Server';
    if (fs.existsSync(mongoRoot)) {
      const versions = fs
        .readdirSync(mongoRoot)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

      for (const version of versions) {
        const candidate = path.join(mongoRoot, version, 'bin', binName);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  throw new Error(
    'MongoDB (mongod) nao encontrado. Instale o MongoDB Server ou adicione o diretorio bin ao PATH.'
  );
}

function isPortOpen(targetPort) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: targetPort });
    const finish = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForPort(targetPort, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortOpen(targetPort)) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

function init() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Diretorio de dados do MongoDB criado: ${dataDir}`);
  } else {
    console.log(`Diretorio de dados ja existe: ${dataDir}`);
  }
}

async function start() {
  if (await isPortOpen(port)) {
    console.log(`MongoDB ja esta em execucao em 127.0.0.1:${port}.`);
    return;
  }

  init();
  const mongod = findMongodBin();
  const child = spawn(
    mongod,
    ['--dbpath', dataDir, '--port', String(port), '--bind_ip', '127.0.0.1', '--logpath', logFile],
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    }
  );

  fs.writeFileSync(pidFile, String(child.pid), 'utf8');
  child.unref();

  if (!(await waitForPort(port))) {
    throw new Error(`O MongoDB nao iniciou. Verifique ${logFile}.`);
  }

  console.log(`MongoDB local iniciado em 127.0.0.1:${port}.`);
}

function stop() {
  if (!fs.existsSync(pidFile)) {
    console.log('Nenhum processo local gerenciado pelo script foi encontrado.');
    return;
  }

  const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());
  if (pid) {
    try {
      process.kill(pid);
      console.log(`Processo MongoDB (${pid}) encerrado.`);
    } catch {
      console.log(`Processo (${pid}) ja nao estava ativo.`);
    }
  }
  fs.rmSync(pidFile, { force: true });
}

async function status() {
  if (await isPortOpen(port)) {
    console.log(`MongoDB ativo e aceitando conexoes em 127.0.0.1:${port}.`);
    process.exit(0);
  } else {
    console.log(`Nenhum servidor MongoDB escutando em 127.0.0.1:${port}.`);
    process.exit(1);
  }
}

const actions = { init, start, stop, status };

if (!actions[action]) {
  console.error(`Acao invalida: ${action}. Use init, start, stop ou status.`);
  process.exit(1);
}

Promise.resolve()
  .then(actions[action])
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
