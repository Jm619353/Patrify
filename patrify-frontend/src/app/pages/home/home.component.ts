import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { PatrimonyService } from '../../core/services/patrimony.service';
import { PatrimonySummary } from '../../core/models/patrimony.model';

Chart.register(...registerables);

const CHART_COLORS = ['#7c3aed', '#e11d74', '#f97316', '#0ea5e9', '#10b981', '#f59e0b', '#64748b', '#ef4444'];

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('valueCanvas') valueCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvas?: ElementRef<HTMLCanvasElement>;

  summary: PatrimonySummary | null = null;
  activeRate = 0;
  statusData: Array<{ label: string; value: number; color: string }> = [];
  loading = true;

  private charts: Array<{ destroy(): void }> = [];
  private renderTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly patrimonyService: PatrimonyService,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    this.destroyCharts();
  }

  load(): void {
    this.loading = true;
    this.patrimonyService.summary().subscribe({
      next: (summary) => {
        this.summary = summary;
        const totals = summary?.totals;
        this.activeRate =
          totals && totals.items > 0 ? Math.round((totals.active / totals.items) * 100) : 0;
        this.statusData = totals
          ? [
              { label: 'Ativos', value: totals.active, color: '#10b981' },
              { label: 'Não ativos', value: totals.inactive, color: '#f59e0b' },
              { label: 'Descartados', value: totals.discarded, color: '#ef4444' }
            ].filter((item) => item.value > 0)
          : [];
        this.loading = false;

        this.ngZone.runOutsideAngular(() => {
          if (this.renderTimer) clearTimeout(this.renderTimer);
          this.renderTimer = setTimeout(() => this.renderCharts(), 0);
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatMonth(month: string): string {
    const [year, monthNumber] = month.split('-');
    const date = new Date(Number(year), Number(monthNumber) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }

  private renderCharts(): void {
    this.destroyCharts();
    const summary = this.summary;
    if (!summary) return;

    if (this.valueCanvas?.nativeElement && summary.valueHistory.length > 0) {
      const context = this.valueCanvas.nativeElement.getContext('2d');
      const gradient = context?.createLinearGradient(0, 0, 0, 280);
      gradient?.addColorStop(0, 'rgba(124, 58, 237, 0.28)');
      gradient?.addColorStop(1, 'rgba(124, 58, 237, 0.01)');

      this.charts.push(
        new Chart(this.valueCanvas.nativeElement, {
          type: 'line',
          data: {
            labels: summary.valueHistory.map((point) => this.formatMonth(point.month)),
            datasets: [
              {
                label: 'Valor acumulado',
                data: summary.valueHistory.map((point) => point.value),
                borderColor: '#7c3aed',
                backgroundColor: gradient ?? 'rgba(124, 58, 237, 0.15)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#7c3aed'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (item) =>
                    ` ${new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(Number(item.raw))}`
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 11 } }
              },
              y: {
                grid: { color: '#f1f5f9' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 11 },
                  callback: (value) =>
                    new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 1
                    }).format(Number(value))
                }
              }
            }
          }
        })
      );
    }

    if (this.categoryCanvas?.nativeElement && summary.byCategory.length > 0) {
      this.charts.push(
        new Chart(this.categoryCanvas.nativeElement, {
          type: 'doughnut',
          data: {
            labels: summary.byCategory.map((item) => item.category),
            datasets: [
              {
                data: summary.byCategory.map((item) => item.items),
                backgroundColor: CHART_COLORS,
                borderWidth: 0,
                hoverOffset: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            cutout: '68%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#64748b',
                  boxWidth: 10,
                  boxHeight: 10,
                  usePointStyle: true,
                  padding: 14,
                  font: { size: 11 }
                }
              }
            }
          }
        })
      );
    }

    if (this.statusCanvas?.nativeElement && this.statusData.length > 0) {
      this.charts.push(
        new Chart(this.statusCanvas.nativeElement, {
          type: 'doughnut',
          data: {
            labels: this.statusData.map((item) => item.label),
            datasets: [
              {
                data: this.statusData.map((item) => item.value),
                backgroundColor: this.statusData.map((item) => item.color),
                borderWidth: 0,
                hoverOffset: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            cutout: '68%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#64748b',
                  boxWidth: 10,
                  boxHeight: 10,
                  usePointStyle: true,
                  padding: 14,
                  font: { size: 11 }
                }
              }
            }
          }
        })
      );
    }
  }

  private destroyCharts(): void {
    this.ngZone.runOutsideAngular(() => {
      this.charts.forEach((chart) => chart.destroy());
      this.charts = [];
    });
  }
}
