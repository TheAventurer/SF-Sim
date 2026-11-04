import { formatLocal, type FactionId, type LocationId, type WorldState } from '../engine';
import { Flag } from './Flag';

const STAT_LABELS: [keyof WorldState['factions'][string]['stats'], string][] = [
  ['legitimacy', 'Legitimacy'],
  ['morale', 'Morale'],
  ['readiness', 'Readiness'],
  ['supply', 'Supply'],
  ['support', 'Public support']
];

function territoryShare(world: WorldState, id: FactionId): number {
  let total = 0, held = 0;
  for (const l of Object.values(world.locations)) {
    if (l.kind !== 'zone' || l.tags?.includes('wilderness')) continue;
    total += l.population;
    held += l.population * (l.control[id] ?? 0);
  }
  return total ? held / total : 0;
}

export function FactionPanel({ world, selected, onSelect }: { world: WorldState; selected: FactionId; onSelect(id: FactionId): void }) {
  const factions = Object.values(world.factions);
  const f = world.factions[selected];
  return (
    <aside className="panel left" aria-label="Factions">
      <h2 className="eyebrow">Factions &amp; actors</h2>
      <ul className="faction-list">
        {factions.map((x) => (
          <li key={x.id}>
            <button type="button" className={`faction-row${x.id === selected ? ' on' : ''}`} aria-pressed={x.id === selected} onClick={() => onSelect(x.id)}>
              <Flag flag={x.flag} width={30} />
              <span className="faction-name">
                <span>{x.name}</span>
                <small>{x.kind}</small>
              </span>
              <span className="mono">{Math.round(territoryShare(world, x.id) * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>
      {f && (
        <section className="faction-detail">
          <div className="row">
            <Flag flag={f.flag} width={36} />
            <h3>{f.name} ({f.short})</h3>
          </div>
          <p className="muted">{f.ideology}</p>
          <p className="small">Leader: <strong>{f.leader}</strong></p>
          {STAT_LABELS.map(([k, label]) => (
            <div key={k} className="stat">
              <div className="stat-head"><span>{label}</span><span className="mono">{f.stats[k]}</span></div>
              <div className="bar"><div style={{ width: `${f.stats[k]}%` }} /></div>
            </div>
          ))}
          <h4 className="eyebrow">Goals</h4>
          <ol className="goals">{f.goals.map((g) => <li key={g}>{g}</li>)}</ol>
        </section>
      )}
    </aside>
  );
}

export function LocationPanel({ world, id }: { world: WorldState; id: LocationId | null }) {
  const l = id ? world.locations[id] : null;
  if (!l) return <p className="muted small">Select an area or city on the map.</p>;
  const parentChain: string[] = [];
  let p = l.parentId;
  while (p) {
    const loc = world.locations[p];
    if (!loc) break;
    parentChain.unshift(loc.name);
    p = loc.parentId;
  }
  const children = Object.values(world.locations).filter((c) => c.parentId === l.id && c.kind !== 'zone');
  const shares = Object.entries(l.control).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const none = Math.max(0, 1 - shares.reduce((s, [, v]) => s + v, 0));
  return (
    <section className="location" aria-label="Selected location">
      <div className="muted small">{parentChain.join(' › ')}</div>
      <h3>{l.name}</h3>
      <div className="small">Population <span className="mono">{l.population.toLocaleString('en-US')}</span></div>
      <div className="control-bar" aria-label="Control shares">
        {shares.map(([fid, v]) => (
          <div key={fid} style={{ width: `${v * 100}%`, background: world.factions[fid]?.color }} title={`${fid} ${Math.round(v * 100)}%`} />
        ))}
        {none > 0 && <div style={{ width: `${none * 100}%` }} className="none" />}
      </div>
      <div className="small control-legend">
        {shares.map(([fid, v]) => <span key={fid}>{fid} {Math.round(v * 100)}%</span>)}
        {none > 0 && <span>none {Math.round(none * 100)}%</span>}
      </div>
      {children.length > 0 && (
        <>
          <h4 className="eyebrow">Inside</h4>
          <ul className="children">{children.map((c) => <li key={c.id}>{c.name}</li>)}</ul>
        </>
      )}
    </section>
  );
}

export function EventLog({ world }: { world: WorldState }) {
  const items = [...world.events].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 50);
  return (
    <section aria-label="Event log" className="events">
      {items.map((e) => (
        <article key={e.id} className={`event sev-${e.severity}`}>
          <div className="event-meta">
            <span className="mono">{formatLocal(e.time, false)}</span>
            <span className="muted">{world.locations[e.locationId]?.name ?? e.locationId}</span>
            <span className={`badge sev-${e.severity}`}>{e.severity}</span>
          </div>
          <h3 className="headline">{e.headline}</h3>
          {e.body && <p className="small muted">{e.body}</p>}
          <div className="row">
            {e.participants.map((p) => world.factions[p] && <Flag key={p} flag={world.factions[p].flag} width={21} />)}
            <span className="mono muted ref">{e.id}</span>
          </div>
        </article>
      ))}
      {world.turns.length > 0 && (
        <p className="muted small">
          {world.turns.length} turn{world.turns.length === 1 ? '' : 's'} processed · last turn {world.turns[world.turns.length - 1].slices} hourly slices.
          Event generation arrives in Milestone 1.
        </p>
      )}
    </section>
  );
}
