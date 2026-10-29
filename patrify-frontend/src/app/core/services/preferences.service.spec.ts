import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  const storageKey = 'patrify.preferences.pageSize';
  let service: PreferencesService;

  beforeEach(() => {
    localStorage.clear();
    service = new PreferencesService();
  });

  afterEach(() => localStorage.clear());

  it('usa 10 itens por página como padrão', () => {
    expect(service.pageSize).toBe(10);
  });

  it('persiste um tamanho de página permitido', () => {
    service.pageSize = 25;

    expect(localStorage.getItem(storageKey)).toBe('25');
    expect(service.pageSize).toBe(25);
  });

  it('ignora tamanhos de página não permitidos', () => {
    service.pageSize = 25;
    service.pageSize = 999;

    expect(service.pageSize).toBe(25);
  });

  it('ignora um valor inválido já armazenado', () => {
    localStorage.setItem(storageKey, 'abc');

    expect(service.pageSize).toBe(10);
  });
});
