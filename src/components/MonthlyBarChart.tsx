import { AXIS_TICK, ChartTooltipCard, useChartColors } from '@/ui';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../i18n/I18nProvider';

export interface MonthlyPoint {
  /** `YYYY-MM` (month) or `YYYY-MM-DD` (start of a day/week bucket). */
  period: string;
  value: number;
}

/**
 * Single-series bar chart per day, week or month (thin bars with rounded tops, recessive grid,
 * hover tooltip). Used for sign-ups (counts) and platform collections (money).
 */
export function MonthlyBarChart({
  points,
  seriesLabel,
  formatValue,
  formatAxis = formatValue,
  height = 240,
  granularity = 'month',
}: {
  points: MonthlyPoint[];
  seriesLabel: string;
  formatValue: (value: number) => string;
  formatAxis?: (value: number) => string;
  height?: number;
  granularity?: 'day' | 'week' | 'month';
}) {
  const colors = useChartColors();
  const { fmt } = useI18n();
  const isMonth = granularity === 'month';
  const tick = (period: string) =>
    isMonth ? fmt.shortPeriod(period.slice(0, 7)) : fmt.shortDate(period);
  const title = (period: string) => (isMonth ? fmt.period(period.slice(0, 7)) : fmt.date(period));
  const data = points.map((point) => ({ ...point, label: tick(point.period) }));

  return (
    <div className="w-full min-w-0" style={{ height }} role="img" aria-label={seriesLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: colors.grid }}
            tick={{ ...AXIS_TICK, fill: colors.axis }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={60}
            allowDecimals={false}
            tick={{ ...AXIS_TICK, fill: colors.axis }}
            tickFormatter={formatAxis}
          />
          <Tooltip
            cursor={{ fill: colors.grid, opacity: 0.5 }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as (MonthlyPoint & { label: string }) | undefined;
              if (!active || !point) return null;
              return (
                <ChartTooltipCard
                  title={<span className="capitalize">{title(point.period)}</span>}
                  rows={[
                    { label: seriesLabel, value: formatValue(point.value), color: colors.series1 },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            fill={colors.series1}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
