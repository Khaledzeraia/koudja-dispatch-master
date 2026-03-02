import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Person, VehicleConfig, VehicleId, Platoon, RANK_LABELS } from '@/lib/types';
import { GuardSlot } from '@/lib/rotation';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportImageProps {
  date: Date;
  platoon: Platoon;
  assignments: Record<VehicleId, Person[]>;
  vehicleConfigs: VehicleConfig[];
  reserve: Person[];
  guardSchedule: GuardSlot[];
}

export function ExportImage({
  date,
  platoon,
  assignments,
  vehicleConfigs,
  reserve,
  guardSchedule,
}: ExportImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;

    // Show the hidden render target
    containerRef.current.style.display = 'block';

    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `koudja-${format(date, 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      containerRef.current.style.display = 'none';
    }
  }, [date]);

  const dateStr = format(date, 'EEEE d MMMM yyyy', { locale: ar });

  const activeConfigs = vehicleConfigs.filter(c => c.isActive);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={handleExport}
      >
        <Download className="h-3.5 w-3.5" />
        تصدير PNG
      </Button>

      {/* Hidden render target for export */}
      <div
        ref={containerRef}
        dir="rtl"
        style={{
          display: 'none',
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '480px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#1a1a2e',
          color: '#e2e8f0',
          padding: '24px',
          borderRadius: '16px',
        }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '2px solid #f59e0b',
        }}>
          <div style={{
            fontSize: '22px',
            fontWeight: 900,
            color: '#f59e0b',
            letterSpacing: '3px',
            marginBottom: '8px',
          }}>
            KOUDJA
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
            📋 توزيع يوم {dateStr}
          </div>
          <div style={{
            display: 'inline-block',
            marginTop: '8px',
            padding: '3px 14px',
            borderRadius: '12px',
            backgroundColor: '#f59e0b22',
            border: '1px solid #f59e0b55',
            color: '#f59e0b',
            fontSize: '13px',
            fontWeight: 700,
          }}>
            الفصيلة {platoon}
          </div>
        </div>

        {/* Vehicle Distribution */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#f59e0b',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            🚒 توزيع الآليات
          </div>

          {activeConfigs.map((config) => {
            const crew = assignments[config.id] || [];
            if (crew.length === 0) return null;
            return (
              <div
                key={config.id}
                style={{
                  backgroundColor: '#16213e',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '8px',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: '#94a3b8',
                }}>
                  {config.icon} {config.nameAr}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {crew.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        backgroundColor: '#0f3460',
                        border: '1px solid #1a4a7a',
                        color: '#93c5fd',
                        fontWeight: 600,
                      }}
                    >
                      {RANK_LABELS[p.rank]} - {p.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reserve */}
        {reserve.length > 0 && (
          <div style={{
            backgroundColor: '#16213e',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '6px',
              color: '#94a3b8',
            }}>
              🔄 الاحتياط ({reserve.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {reserve.map((p) => (
                <span
                  key={p.id}
                  style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {RANK_LABELS[p.rank]} - {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Guard Schedule */}
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#f59e0b',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            🕐 جدول الحراسة
          </div>

          {guardSchedule.map((slot, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#16213e',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#94a3b8',
                direction: 'ltr',
              }}>
                {slot.period.label}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {slot.personnel.length > 0 ? (
                  slot.personnel.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        backgroundColor: p.rank === 'corporal' ? '#064e3b' : '#0f3460',
                        border: `1px solid ${p.rank === 'corporal' ? '#065f46' : '#1a4a7a'}`,
                        color: p.rank === 'corporal' ? '#6ee7b7' : '#93c5fd',
                        fontWeight: 600,
                      }}
                    >
                      {RANK_LABELS[p.rank]} - {p.name}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #334155',
          fontSize: '11px',
          color: '#475569',
          fontWeight: 700,
          letterSpacing: '2px',
        }}>
          📌 KOUDJA
        </div>
      </div>
    </>
  );
}
