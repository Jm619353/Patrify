import { Component, OnInit } from '@angular/core';
import { ApiError } from '../../core/models/api.model';
import { DiscardPoint } from '../../core/models/discard.model';
import { DiscardService } from '../../core/services/discard.service';

interface RadiusOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-descarte',
  templateUrl: './descarte.component.html',
  styleUrls: ['./descarte.component.css']
})
export class DescarteComponent implements OnInit {
  readonly materialSuggestions = [
    'Eletrônicos',
    'Pilhas e baterias',
    'Lâmpadas',
    'Óleo de cozinha',
    'Papel e papelão',
    'Plástico',
    'Vidro',
    'Metal',
    'Móveis',
    'Entulho',
    'Pneus',
    'Medicamentos',
    'Têxteis'
  ];

  readonly tips = [
    'Remova dados e acessórios sensíveis dos equipamentos.',
    'Separe pilhas, baterias e lâmpadas dos demais resíduos.',
    'Confirme o horário de funcionamento do ponto de coleta.',
    'Registre o descarte no inventário para manter o histórico.'
  ];

  readonly radiusOptions: RadiusOption[] = [
    { value: 1_000, label: '1 km' },
    { value: 2_500, label: '2,5 km' },
    { value: 5_000, label: '5 km' },
    { value: 10_000, label: '10 km' },
    { value: 20_000, label: '20 km' },
    { value: 50_000, label: '50 km' }
  ];

  material = '';
  radius = 5_000;

  latitude: number | null = null;
  longitude: number | null = null;
  locationLabel = 'Localização não definida';
  locationError = '';
  locating = false;
  manualMode = false;

  loading = false;
  searched = false;
  searchError = '';
  points: DiscardPoint[] = [];
  lastSearch: { material: string; radius: number } | null = null;

  constructor(private readonly discardService: DiscardService) {}

  ngOnInit(): void {
    this.detectLocation();
  }

  get hasCoordinates(): boolean {
    return (
      this.latitude !== null &&
      this.longitude !== null &&
      !Number.isNaN(this.latitude) &&
      !Number.isNaN(this.longitude) &&
      Math.abs(this.latitude) <= 90 &&
      Math.abs(this.longitude) <= 180
    );
  }

  get canSearch(): boolean {
    return this.material.trim().length >= 2 && this.hasCoordinates && !this.loading;
  }

  get coordinatesLabel(): string {
    if (!this.hasCoordinates) return '—';
    return `${Number(this.latitude).toFixed(5)}, ${Number(this.longitude).toFixed(5)}`;
  }

  detectLocation(): void {
    if (!('geolocation' in navigator)) {
      this.locationError = 'Seu navegador não oferece suporte a geolocalização.';
      this.manualMode = true;
      return;
    }

    this.locating = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude = Number(position.coords.latitude.toFixed(6));
        this.longitude = Number(position.coords.longitude.toFixed(6));
        this.locationLabel = 'Localização atual detectada';
        this.locating = false;
      },
      (error) => {
        this.locating = false;
        this.manualMode = true;
        this.locationError = this.geolocationErrorMessage(error);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 }
    );
  }

  applyManualCoordinates(): void {
    this.manualMode = true;
  }

  onCoordinatesChange(): void {
    if (this.hasCoordinates) {
      this.locationLabel = 'Coordenadas informadas manualmente';
      this.locationError = '';
    }
  }

  search(): void {
    if (!this.canSearch || this.latitude === null || this.longitude === null) return;

    const material = this.material.trim();
    this.loading = true;
    this.searchError = '';
    this.searched = true;

    this.discardService
      .search({
        material,
        latitude: Number(this.latitude),
        longitude: Number(this.longitude),
        radius: Number(this.radius)
      })
      .subscribe({
        next: (points) => {
          this.points = points;
          this.lastSearch = { material, radius: this.radius };
          this.loading = false;
        },
        error: (error: ApiError) => {
          this.points = [];
          this.searchError =
            error?.message ||
            'Não foi possível consultar os pontos de descarte agora. Tente novamente.';
          this.loading = false;
        }
      });
  }

  mapsUrl(point: DiscardPoint): string {
    if (point.mapsUrl) return point.mapsUrl;
    if (point.latitude !== null && point.longitude !== null) {
      return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${point.name} ${point.address ?? ''}`
    )}`;
  }

  radiusLabel(value: number): string {
    return this.radiusOptions.find((option) => option.value === value)?.label ?? `${value / 1000} km`;
  }

  trackByPlace(_index: number, point: DiscardPoint): string {
    return point.id;
  }

  private geolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permissão de localização negada. Informe as coordenadas manualmente.';
      case error.POSITION_UNAVAILABLE:
        return 'Não foi possível obter sua localização. Informe as coordenadas manualmente.';
      case error.TIMEOUT:
        return 'A localização demorou para responder. Tente novamente ou informe as coordenadas.';
      default:
        return 'Não foi possível detectar sua localização. Informe as coordenadas manualmente.';
    }
  }
}
