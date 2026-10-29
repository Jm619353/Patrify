const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getCollection, ensureIndexes, close } = require('../config/database');
const logger = require('../config/logger');

const DEMO_USER = {
  name: 'Empresa Demonstração',
  legalName: 'Patrify Tecnologia Demonstração LTDA',
  cnpj: '11222333000181',
  email: 'demo@patrify.app',
  password: 'Patrify@2024',
  phone1: '11999990000',
  address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP, 01310-100',
  economicActivity: 'Desenvolvimento de programas de computador sob encomenda'
};

const PATRIMONIES = [
  {
    name: 'Notebook Dell Latitude 5440',
    value: 5899.9,
    purchaseDate: '2024-01-15',
    location: 'Matriz - TI',
    status: 'Ativo',
    condition: 'Excelente',
    category: 'Tecnologia',
    serial: 'TECHDEMO0001',
    responsible: 'Lucas Andrade · Engenharia',
    invoiceNumber: 'NF-2024-00142',
    warrantyUntil: '2027-01-15',
    notes: 'Intel Core i7 13ª Geração, 16 GB RAM, 512 GB NVMe SSD. Garantia ProSupport Dell.'
  },
  {
    name: 'Monitor LG UltraWide 34"',
    value: 2499.0,
    purchaseDate: '2024-02-08',
    location: 'Matriz - TI',
    status: 'Ativo',
    condition: 'Novo',
    category: 'Tecnologia',
    serial: 'TECHDEMO0002',
    responsible: 'Marina Costa · Design',
    invoiceNumber: 'NF-2024-00198',
    warrantyUntil: '2027-02-08',
    notes: 'Painel IPS WQHD 3440x1440, USB-C e HDR10.'
  },
  {
    name: 'Mesa de reunião 12 lugares',
    value: 4200.0,
    purchaseDate: '2023-11-20',
    location: 'Sala de reuniões',
    status: 'Ativo',
    condition: 'Excelente',
    category: 'Mobiliário',
    serial: 'MOBLDEMO0001',
    responsible: 'Facilities · Administração',
    invoiceNumber: 'NF-2023-08812',
    warrantyUntil: '2028-11-20',
    notes: 'Tampo em madeira maciça com calha eletrificada central e tomadas RJ45/HDMI.'
  },
  {
    name: 'Empilhadeira elétrica',
    value: 48900.0,
    purchaseDate: '2023-06-10',
    location: 'Centro de distribuição',
    status: 'Ativo',
    condition: 'Regular',
    category: 'Logística',
    serial: 'LOGIDEMO0001',
    responsible: 'Roberto Silva · Operações CD',
    invoiceNumber: 'NF-2023-04110',
    warrantyUntil: '2026-12-10',
    notes: 'Capacidade de carga de 2.500 kg, mastro triplex 4,5m. Revisão trimestral.'
  },
  {
    name: 'Impressora fiscal antiga',
    value: 1200.0,
    purchaseDate: '2019-03-05',
    location: 'Matriz - Financeiro',
    status: 'Não ativo',
    condition: 'Obsoleto',
    category: 'Tecnologia',
    serial: 'TECHDEMO0003',
    responsible: 'Setor Fiscal',
    invoiceNumber: 'NF-2019-01022',
    warrantyUntil: '2021-03-05',
    notes: 'Substituída por emissão eletrônica em nuvem. Aguardando baixa para reciclagem.'
  },
  {
    name: 'Cadeira ergonômica',
    value: 899.0,
    purchaseDate: '2022-09-12',
    location: 'Matriz - Operações',
    status: 'Não ativo',
    condition: 'Com defeitos',
    category: 'Mobiliário',
    serial: 'MOBLDEMO0002',
    responsible: 'Almoxarifado',
    invoiceNumber: 'NF-2022-05419',
    warrantyUntil: '2025-09-12',
    notes: 'Pistão pneumático necessita substituição.'
  },
  {
    name: 'Servidor rack legado',
    value: 15600.0,
    purchaseDate: '2018-01-22',
    location: 'Data center',
    status: 'Não ativo',
    condition: 'Descartado',
    category: 'Tecnologia',
    serial: 'TECHDEMO0004',
    responsible: 'Infraestrutura & Cloud',
    invoiceNumber: 'NF-2018-00309',
    warrantyUntil: '2021-01-22',
    notes: 'Descomissionado após migração das cargas para nuvem. Discos sanitizados.'
  },
  {
    name: 'Veículo utilitário',
    value: 89900.0,
    purchaseDate: '2023-03-18',
    location: 'Frota',
    status: 'Ativo',
    condition: 'Excelente',
    category: 'Transporte',
    serial: 'TRANDEMO0001',
    responsible: 'Gestão de Frota',
    invoiceNumber: 'NF-2023-01950',
    warrantyUntil: '2027-03-18',
    notes: 'Furgão utilitário para entregas urbanas. Seguro e rastreador ativos.'
  }
];

const run = async () => {
  await ensureIndexes();

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
  const now = new Date();
  const users = await getCollection('users');
  const patrimonies = await getCollection('patrimonies');
  const maintenances = await getCollection('maintenances');
  const loans = await getCollection('loans');
  const insurances = await getCollection('insurances');

  const userDoc = await users.findOneAndUpdate(
    { cnpj: DEMO_USER.cnpj },
    {
      $set: {
        passwordHash,
        updatedAt: now
      },
      $setOnInsert: {
        name: DEMO_USER.name,
        phone1: DEMO_USER.phone1,
        phone2: null,
        email: DEMO_USER.email.toLowerCase(),
        cnpj: DEMO_USER.cnpj,
        legalName: DEMO_USER.legalName,
        address: DEMO_USER.address,
        economicActivity: DEMO_USER.economicActivity,
        branchType: 'Matriz',
        companySize: 'Médio porte',
        createdAt: now,
        lastLoginAt: null,
        passwordChangedAt: null
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  const userId = userDoc._id;

  for (const item of PATRIMONIES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await patrimonies.findOne({ serialNumber: item.serial });
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await patrimonies.insertOne({
        userId,
        name: item.name,
        value: item.value,
        purchaseDate: item.purchaseDate,
        location: item.location,
        status: item.status,
        condition: item.condition,
        category: item.category,
        serialNumber: item.serial,
        quantity: 1,
        responsible: item.responsible,
        invoiceNumber: item.invoiceNumber,
        warrantyUntil: item.warrantyUntil,
        notes: item.notes,
        movements: [
          {
            id: crypto.randomUUID(),
            type: 'Cadastro',
            description: 'Patrimônio registrado no inventário corporativo.',
            location: item.location,
            responsible: item.responsible,
            status: item.status,
            condition: item.condition,
            createdAt: new Date(`${item.purchaseDate}T12:00:00Z`)
          }
        ],
        imageUrl: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now
      });
    } else if (!existing.responsible && !existing.movements) {
      // Enriquecer itens já existentes do seed anterior
      // eslint-disable-next-line no-await-in-loop
      await patrimonies.updateOne(
        { _id: existing._id },
        {
          $set: {
            responsible: item.responsible,
            invoiceNumber: item.invoiceNumber,
            warrantyUntil: item.warrantyUntil,
            notes: item.notes,
            movements: [
              {
                id: crypto.randomUUID(),
                type: 'Cadastro',
                description: 'Patrimônio registrado no inventário corporativo.',
                location: item.location,
                responsible: item.responsible,
                status: item.status,
                condition: item.condition,
                createdAt: new Date(`${item.purchaseDate}T12:00:00Z`)
              }
            ]
          }
        }
      );
    }
  }

  const maintCount = await maintenances.countDocuments({ userId });
  if (maintCount === 0) {
    const forklift = await patrimonies.findOne({ serialNumber: 'LOGIDEMO0001' });
    const chair = await patrimonies.findOne({ serialNumber: 'MOBLDEMO0002' });
    const vehicle = await patrimonies.findOne({ serialNumber: 'TRANDEMO0001' });
    const laptop = await patrimonies.findOne({ serialNumber: 'TECHDEMO0001' });

    const seedMaintenances = [
      forklift && {
        userId,
        patrimonyId: forklift._id,
        patrimonyName: forklift.name,
        serialNumber: forklift.serialNumber,
        category: forklift.category,
        title: 'Revisão trimestral do sistema hidráulico e bateria tracionária',
        type: 'Preventiva',
        priority: 'Alta',
        status: 'Em andamento',
        provider: 'Linde Empilhadeiras Assistência Técnica',
        cost: 1450.0,
        scheduledDate: '2026-10-30',
        completedAt: null,
        notes: 'Verificação de mangueiras de alta pressão, fluido hidráulico e densidade da bateria.',
        createdAt: now,
        updatedAt: now
      },
      chair && {
        userId,
        patrimonyId: chair._id,
        patrimonyName: chair.name,
        serialNumber: chair.serialNumber,
        category: chair.category,
        title: 'Substituição de pistão pneumático classe 4 e rodízios PU',
        type: 'Corretiva',
        priority: 'Média',
        status: 'Aberta',
        provider: 'ErgoOffice Manutenções',
        cost: 220.0,
        scheduledDate: '2026-11-05',
        completedAt: null,
        notes: 'Cadeira apresenta perda de pressão no ajuste de altura.',
        createdAt: now,
        updatedAt: now
      },
      vehicle && {
        userId,
        patrimonyId: vehicle._id,
        patrimonyName: vehicle.name,
        serialNumber: vehicle.serialNumber,
        category: vehicle.category,
        title: 'Revisão de 30.000 km (óleo, filtros, pastilhas de freio e alinhamento)',
        type: 'Preventiva',
        priority: 'Alta',
        status: 'Concluída',
        provider: 'Concessionária Oficial Frota SP',
        cost: 1890.0,
        scheduledDate: '2026-09-15',
        completedAt: now,
        notes: 'Serviço executado dentro do plano de manutenção preventiva da frota.',
        createdAt: now,
        updatedAt: now
      },
      laptop && {
        userId,
        patrimonyId: laptop._id,
        patrimonyName: laptop.name,
        serialNumber: laptop.serialNumber,
        category: laptop.category,
        title: 'Limpeza térmica preventiva e atualização de BIOS corporativa',
        type: 'Preventiva',
        priority: 'Baixa',
        status: 'Concluída',
        provider: 'Dell ProSupport / TI Interna',
        cost: 0,
        scheduledDate: '2026-08-20',
        completedAt: now,
        notes: 'Coberto pela garantia ProSupport.',
        createdAt: now,
        updatedAt: now
      }
    ].filter(Boolean);

    if (seedMaintenances.length > 0) {
      await maintenances.insertMany(seedMaintenances);
      logger.info({ total: seedMaintenances.length }, 'Ordens de manutenção de demonstração inseridas');
    }
  }

  const loanCount = await loans.countDocuments({ userId });
  if (loanCount === 0) {
    const laptop = await patrimonies.findOne({ serialNumber: 'TECHDEMO0001' });
    const monitor = await patrimonies.findOne({ serialNumber: 'TECHDEMO0002' });
    const vehicle = await patrimonies.findOne({ serialNumber: 'TRANDEMO0001' });

    const seedLoans = [
      laptop && {
        userId,
        patrimonyId: laptop._id,
        patrimonyName: laptop.name,
        serialNumber: laptop.serialNumber,
        category: laptop.category,
        borrowerName: 'Mariana Costa',
        borrowerDocument: '389.412.778-09',
        department: 'Engenharia de Produto',
        purpose: 'Apresentação comercial e homologação técnica em cliente externo (Campinas/SP)',
        loanDate: '2026-10-20',
        expectedReturnDate: '2026-11-05',
        returnedAt: null,
        status: 'Em andamento',
        conditionOut: 'Excelente',
        conditionIn: null,
        notes: 'Acompanha carregador original USB-C 65W e case protetora.',
        createdAt: now,
        updatedAt: now
      },
      vehicle && {
        userId,
        patrimonyId: vehicle._id,
        patrimonyName: vehicle.name,
        serialNumber: vehicle.serialNumber,
        category: vehicle.category,
        borrowerName: 'Roberto Almeida',
        borrowerDocument: '214.889.301-44',
        department: 'Operações e Logística',
        purpose: 'Vistoria técnica nas filiais do interior e coleta de equipamentos',
        loanDate: '2026-10-10',
        expectedReturnDate: '2026-10-22',
        returnedAt: null,
        status: 'Em andamento',
        conditionOut: 'Bom',
        conditionIn: null,
        notes: 'Tanque cheio na saída. Quilometragem inicial: 31.420 km.',
        createdAt: now,
        updatedAt: now
      },
      monitor && {
        userId,
        patrimonyId: monitor._id,
        patrimonyName: monitor.name,
        serialNumber: monitor.serialNumber,
        category: monitor.category,
        borrowerName: 'Lucas Fernandes',
        borrowerDocument: '412.605.918-22',
        department: 'Design & UX',
        purpose: 'Uso temporário em regime de home-office durante reforma do 4º andar',
        loanDate: '2026-09-01',
        expectedReturnDate: '2026-09-30',
        returnedAt: now,
        status: 'Devolvido',
        conditionOut: 'Novo',
        conditionIn: 'Excelente',
        notes: 'Devolvido completo com cabo DisplayPort e suporte original.',
        createdAt: now,
        updatedAt: now
      }
    ].filter(Boolean);

    if (seedLoans.length > 0) {
      await loans.insertMany(seedLoans);
      logger.info({ total: seedLoans.length }, 'Empréstimos de demonstração inseridos');
    }
  }

  const insuranceCount = await insurances.countDocuments({ userId });
  if (insuranceCount === 0) {
    const vehicle = await patrimonies.findOne({ serialNumber: 'TRANDEMO0001' });
    const forklift = await patrimonies.findOne({ serialNumber: 'LOGIDEMO0001' });
    const laptop = await patrimonies.findOne({ serialNumber: 'TECHDEMO0001' });
    const building = await patrimonies.findOne({ serialNumber: 'IMOVDEMO0001' });

    const seedInsurances = [
      vehicle && {
        userId,
        patrimonyId: vehicle._id,
        patrimonyName: vehicle.name,
        serialNumber: vehicle.serialNumber,
        category: vehicle.category,
        policyNumber: 'APO-FROTA-2026-8891',
        insurer: 'Porto Seguro Corporativo',
        coverageType: 'Cobertura Total / Casco',
        insuredAmount: 118000.0,
        premiumCost: 4250.0,
        deductible: 3800.0,
        startDate: '2026-01-15',
        endDate: '2027-01-15',
        status: 'Vigente',
        brokerContact: 'Corretora Prime · (11) 3090-4400',
        claimNotes: null,
        claimedAt: null,
        notes: 'Cobertura 100% FIPE + RCF-V danos materiais R$ 200.000 e assistência 24h ilimitada.',
        createdAt: now,
        updatedAt: now
      },
      forklift && {
        userId,
        patrimonyId: forklift._id,
        patrimonyName: forklift.name,
        serialNumber: forklift.serialNumber,
        category: forklift.category,
        policyNumber: 'APO-MAQ-2026-3104',
        insurer: 'Tokio Marine Riscos Industriais',
        coverageType: 'Danos Elétricos e Líquidos',
        insuredAmount: 95000.0,
        premiumCost: 2890.0,
        deductible: 2500.0,
        startDate: '2025-11-18',
        endDate: '2026-11-18',
        status: 'Vigente',
        brokerContact: 'Aon Risk Solutions · sinistros@aon.com',
        claimNotes: null,
        claimedAt: null,
        notes: 'Apólice próxima da renovação anual. Cobre tombamento, curto-circuito e colisão em galpão.',
        createdAt: now,
        updatedAt: now
      },
      laptop && {
        userId,
        patrimonyId: laptop._id,
        patrimonyName: laptop.name,
        serialNumber: laptop.serialNumber,
        category: laptop.category,
        policyNumber: 'GAR-DELL-PRO-99412',
        insurer: 'Dell ProSupport Plus + CompleteCare',
        coverageType: 'Garantia Estendida Fabricante',
        insuredAmount: 9800.0,
        premiumCost: 890.0,
        deductible: 0,
        startDate: '2025-05-10',
        endDate: '2028-05-10',
        status: 'Vigente',
        brokerContact: '0800-970-3355 (Atendimento On-Site 24h)',
        claimNotes: null,
        claimedAt: null,
        notes: 'Cobertura contra danos acidentais (quedas e derramamento de líquidos) e atendimento no próximo dia útil.',
        createdAt: now,
        updatedAt: now
      },
      building && {
        userId,
        patrimonyId: building._id,
        patrimonyName: building.name,
        serialNumber: building.serialNumber,
        category: building.category,
        policyNumber: 'APO-PAT-2026-0012',
        insurer: 'Mapfre Seguros Empresariais',
        coverageType: 'Incêndio e Riscos Patrimoniais',
        insuredAmount: 1450000.0,
        premiumCost: 8900.0,
        deductible: 12000.0,
        startDate: '2026-03-01',
        endDate: '2027-03-01',
        status: 'Vigente',
        brokerContact: 'Corretora Prime · (11) 3090-4400',
        claimNotes: null,
        claimedAt: null,
        notes: 'Cobertura patrimonial compreensiva para galpão, docas, telhado e instalações elétricas.',
        createdAt: now,
        updatedAt: now
      }
    ].filter(Boolean);

    if (seedInsurances.length > 0) {
      await insurances.insertMany(seedInsurances);
      logger.info({ total: seedInsurances.length }, 'Apólices de seguro de demonstração inseridas');
    }
  }

  // Garantir que o usuário principal tenha papel de administrador global e plano enterprise
  await users.updateOne(
    { _id: userId },
    { $set: { role: 'admin', plan: 'enterprise', active: true } }
  );

  // Empresas clientes adicionais para administração multi-empresa
  const EXTRA_COMPANIES = [
    {
      name: 'Horizonte Logística',
      legalName: 'Horizonte Logística Integrada S.A.',
      cnpj: '33000167000101',
      email: 'contato@horizontelog.com.br',
      phone1: '1134567890',
      address: 'Rod. Anhanguera, Km 24, Perus - São Paulo/SP',
      economicActivity: 'Transporte rodoviário de cargas e armazenagem',
      branchType: 'Matriz',
      companySize: 'Grande porte',
      role: 'company',
      plan: 'pro',
      active: true,
      patrimonies: [
        {
          name: 'Caminhão VUC Elétrico BYD eT3',
          value: 265000.0,
          purchaseDate: '2025-07-10',
          location: 'Pátio de Expedição Doca 04 - SP',
          status: 'Ativo',
          condition: 'Novo',
          category: 'Transporte',
          serial: 'TRANHORZ0001',
          quantity: 1,
          responsible: 'Marcos Vinícius (Frota)',
          invoiceNumber: 'NF-99104',
          warrantyUntil: '2028-07-10',
          notes: 'Veículo 100% elétrico para entregas urbanas Last-Mile.'
        },
        {
          name: 'Transpaleteira Elétrica 2.0 Toneladas',
          value: 28900.0,
          purchaseDate: '2025-03-18',
          location: 'Centro de Distribuição Galpão B',
          status: 'Ativo',
          condition: 'Excelente',
          category: 'Logística',
          serial: 'LOGIHORZ0002',
          quantity: 2,
          responsible: 'Carlos Eduardo (Armazém)',
          invoiceNumber: 'NF-88412',
          warrantyUntil: '2027-03-18',
          notes: 'Operação em corredor estreito.'
        },
        {
          name: 'Coletor de Dados RFID/Barcode Zebra TC26',
          value: 4200.0,
          purchaseDate: '2025-09-01',
          location: 'Setor de Conferência e Inventário',
          status: 'Ativo',
          condition: 'Excelente',
          category: 'Tecnologia',
          serial: 'TECHHORZ0003',
          quantity: 5,
          responsible: 'Equipe WMS',
          invoiceNumber: 'NF-99810',
          warrantyUntil: '2027-09-01',
          notes: 'Terminais móveis Android para leitura de etiquetas.'
        }
      ]
    },
    {
      name: 'BioMed Diagnósticos',
      legalName: 'BioMed Diagnósticos e Laboratórios LTDA',
      cnpj: '06990590000123',
      email: 'gestao@biomedlab.com.br',
      phone1: '1122334455',
      address: 'Av. Brasil, 1850, Jardim América - São Paulo/SP',
      economicActivity: 'Laboratórios clínicos e diagnóstico por imagem',
      branchType: 'Filial',
      companySize: 'Médio porte',
      role: 'company',
      plan: 'basic',
      active: true,
      patrimonies: [
        {
          name: 'Estação de Análise Laboratorial Dell Precision 3660',
          value: 16400.0,
          purchaseDate: '2025-04-12',
          location: 'Laboratório Central - Sala de Laudos 02',
          status: 'Ativo',
          condition: 'Novo',
          category: 'Tecnologia',
          serial: 'TECHBIOM0001',
          quantity: 2,
          responsible: 'Dra. Helena Vasconcelos',
          invoiceNumber: 'NF-45019',
          warrantyUntil: '2028-04-12',
          notes: 'Workstation dedicada ao processamento de imagens médicas.'
        },
        {
          name: 'Bancada Inox Esterilizável Hospitalar 2,20m',
          value: 5800.0,
          purchaseDate: '2024-11-20',
          location: 'Setor de Coleta e Triagem',
          status: 'Ativo',
          condition: 'Excelente',
          category: 'Mobiliário',
          serial: 'MOBLBIOM0002',
          quantity: 3,
          responsible: 'Coordenação de Enfermagem',
          invoiceNumber: 'NF-39100',
          warrantyUntil: '2026-11-20',
          notes: 'Aço inoxidável AISI 304 com cuba integrada.'
        }
      ]
    }
  ];

  for (const comp of EXTRA_COMPANIES) {
    // eslint-disable-next-line no-await-in-loop
    const compDoc = await users.findOneAndUpdate(
      { cnpj: comp.cnpj },
      {
        $set: {
          passwordHash,
          plan: comp.plan,
          updatedAt: now
        },
        $setOnInsert: {
          name: comp.name,
          legalName: comp.legalName,
          cnpj: comp.cnpj,
          email: comp.email,
          phone1: comp.phone1,
          phone2: null,
          address: comp.address,
          economicActivity: comp.economicActivity,
          branchType: comp.branchType,
          companySize: comp.companySize,
          role: comp.role,
          active: comp.active,
          createdAt: now,
          lastLoginAt: now,
          passwordChangedAt: null
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    for (const pat of comp.patrimonies) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await patrimonies.findOne({ serialNumber: pat.serial });
      if (!exists) {
        // eslint-disable-next-line no-await-in-loop
        await patrimonies.insertOne({
          userId: compDoc._id,
          name: pat.name,
          value: pat.value,
          purchaseDate: pat.purchaseDate,
          location: pat.location,
          status: pat.status,
          condition: pat.condition,
          category: pat.category,
          serialNumber: pat.serial,
          quantity: pat.quantity,
          responsible: pat.responsible,
          invoiceNumber: pat.invoiceNumber,
          warrantyUntil: pat.warrantyUntil,
          notes: pat.notes,
          movements: [
            {
              id: crypto.randomUUID(),
              type: 'Cadastro',
              description: `Patrimônio registrado para a empresa ${comp.name}.`,
              location: pat.location,
              responsible: pat.responsible,
              status: pat.status,
              condition: pat.condition,
              createdAt: new Date(`${pat.purchaseDate}T12:00:00Z`)
            }
          ],
          imageUrl: null,
          deletedAt: null,
          createdAt: now,
          updatedAt: now
        });
      }
    }
  }

  logger.info(
    { email: DEMO_USER.email, password: DEMO_USER.password },
    'Seed concluído. Use estas credenciais para acessar o ambiente de demonstração.'
  );
};

run()
  .catch((error) => {
    logger.error({ err: error }, 'Falha ao executar seed');
    process.exitCode = 1;
  })
  .finally(() => close());
