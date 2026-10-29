import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

interface ShowcaseFeature {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  bullets: string[];
}

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.scss']
})
export class LandingpageComponent {
  readonly currentYear = new Date().getFullYear();

  readonly chartBars = [42, 58, 51, 72, 64, 86, 94];
  readonly chartMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];

  readonly features: ShowcaseFeature[] = [
    {
      id: 'inventario',
      label: 'Inventário',
      title: 'Todo o patrimônio em um só lugar',
      description:
        'Cadastre bens com categoria, conservação, localização e responsável. O Patrify gera o código de série automaticamente e mantém o histórico organizado.',
      image: 'assets/imgs/inventario.png',
      imageAlt: 'Tela do inventário com filtros, tabela de bens e ações de edição',
      bullets: [
        'Busca por nome, série ou localização',
        'Filtros por status, categoria e conservação',
        'Paginação configurável e exportação CSV'
      ]
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      title: 'Indicadores prontos para decidir',
      description:
        'Acompanhe valor ativo, bens ociosos e descartados, evolução mensal e distribuição por categoria em gráficos que se atualizam com o inventário.',
      image: 'assets/imgs/grafico.png',
      imageAlt: 'Dashboard com cartões de indicadores e gráficos de patrimônio',
      bullets: [
        'Consolidação por status e categoria',
        'Evolução do valor ativo por mês',
        'Visão dos bens recentes'
      ]
    },
    {
      id: 'descarte',
      label: 'Descarte',
      title: 'Descarte responsável sem complicação',
      description:
        'Use sua localização ou informe coordenadas manualmente para encontrar pontos de coleta próximos, filtrando pelo tipo de material.',
      image: 'assets/imgs/descarte.png',
      imageAlt: 'Tela de descarte com busca por material e resultados no mapa',
      bullets: [
        'Geolocalização do navegador',
        'Busca por material e raio de distância',
        'Rotas diretas para o Google Maps'
      ]
    },
    {
      id: 'perfil',
      label: 'Conta',
      title: 'Dados da empresa e segurança',
      description:
        'O cadastro é preenchido a partir do CNPJ. No perfil, atualize contatos e mantenha a senha protegida com troca assistida e recuperação por e-mail.',
      image: 'assets/imgs/userpage.png',
      imageAlt: 'Página de perfil com dados da empresa e segurança da conta',
      bullets: [
        'Enriquecimento automático via CNPJ',
        'Perfil editável e dados fiscais protegidos',
        'Troca e recuperação de senha'
      ]
    }
  ];

  activeFeatureId = this.features[0].id;
  showBackToTop = false;

  constructor(private readonly router: Router) {}

  get activeFeature(): ShowcaseFeature {
    return this.features.find((feature) => feature.id === this.activeFeatureId) ?? this.features[0];
  }

  selectFeature(id: string): void {
    this.activeFeatureId = id;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/login']);
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showBackToTop = window.scrollY > 480;
  }
}
