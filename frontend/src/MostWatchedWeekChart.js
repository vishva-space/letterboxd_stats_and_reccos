import React from 'react';
import './MostWatchedWeekChart.css';

const MostWatchedWeekChart = ({ weeks = [], highlightIndex = null, highlightLabel = '', year = null }) => {
  const max = Math.max(...weeks, 1);

  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // compute tick positions (percent) based on the first week index of each month for the provided year
  let monthPositions = [];
  try {
    const y = year ? Number(year) : new Date().getFullYear();
    const jan1 = new Date(`${y}-01-01T00:00:00`);
    for (let m = 0; m < 12; m++) {
      const d = new Date(y, m, 1);
      let dayDiff = Math.floor((d - jan1) / (24 * 60 * 60 * 1000));
      if (dayDiff < 0) dayDiff = 0;
      let weekIdx = Math.floor(dayDiff / 7);
      if (weekIdx > 51) weekIdx = 51;
      const pct = (weekIdx / 51) * 100;
      monthPositions.push({ label: monthLabels[m], pct, weekIdx });
    }
  } catch (err) {
    // fallback to equal spacing
    monthPositions = monthLabels.map((lab, i) => ({ label: lab, pct: (i / 11) * 100, weekIdx: Math.round((i / 11) * 51) }));
  }

  return (
    <div className="mw-chart-root" role="img" aria-label="Most watched week chart">
      <div className="mw-chart-body">
        <div className="mw-chart-plot">
          <div className="mw-chart-bars">
          {weeks.map((v, i) => {
            const heightPct = Math.round((v / max) * 100);
            const isHighlight = i === highlightIndex;
            return (
              <div
                key={i}
                className={"mw-chart-bar" + (isHighlight ? ' highlight' : '')}
                style={{ height: `${Math.max(2, heightPct)}%` }}
                title={`${v} films — Week ${i + 1}`}
              />
            );
          })}
          </div>

          <div className="mw-chart-xlabels">
            {monthPositions.map((m) => (
              <div key={m.label} className="mw-tick" style={{ left: `${m.pct}%` }}>{m.label}</div>
            ))}
          </div>
        </div>

        <div className="mw-chart-side">
          {highlightIndex !== null && (
            <div className="mw-chart-highlight">
              <div className="mw-chart-highlight-count">{weeks[highlightIndex]} Films</div>
              <div className="mw-chart-highlight-week">Week {highlightIndex + 1}</div>
              {highlightLabel && <div className="mw-chart-highlight-dates">{highlightLabel}</div>}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default MostWatchedWeekChart;
