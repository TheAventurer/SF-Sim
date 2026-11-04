import { useMemo } from 'react';
import {
  SOUTH_FLORIDA_BOUNDS,
  centroid,
  dominantController,
  isContested,
  makeProjection,
  ringToPath,
  type LocationId,
  type WorldState
} from '../engine';

interface Props {
  world: WorldState;
  selected: LocationId | null;
  onSelect(id: LocationId): void;
}

const WIDTH = 640;

export function MapView({ world, selected, onSelect }: Props) {
  const proj = useMemo(() => makeProjection(SOUTH_FLORIDA_BOUNDS, WIDTH), []);
  const locs = Object.values(world.locations);
  const zones = locs.filter((l) => l.kind === 'zone' && l.polygons);
  const cities = locs.filter((l) => l.kind === 'city' && l.point);
  const scaleKm = 25;

  return (
    <svg
      className="map"
      viewBox={`0 0 ${proj.width} ${proj.height}`}
      role="img"
      aria-label="Map of South Florida showing territorial control"
    >
      <rect width={proj.width} height={proj.height} className="map-sea" />
      {world.geography.coastline.map((ring, i) => (
        <path key={`c${i}`} d={ringToPath(ring, proj)} className="map-land" />
      ))}

      {zones.map((z) => {
        const dom = dominantController(z);
        const color = dom ? world.factions[dom.id]?.color : undefined;
        const contested = isContested(z);
        const d = z.polygons!.map((r) => ringToPath(r, proj)).join('');
        return (
          <path
            key={z.id}
            d={d}
            fill={color ?? 'transparent'}
            fillOpacity={dom ? 0.25 + dom.share * 0.35 : 0}
            className={`map-zone${contested ? ' contested' : ''}${selected === z.id ? ' selected' : ''}`}
            onClick={() => onSelect(z.id)}
          >
            <title>{z.name}</title>
          </path>
        );
      })}

      {world.geography.water.map((ring, i) => (
        <path key={`w${i}`} d={ringToPath(ring, proj)} className="map-water" />
      ))}

      {zones.filter((z) => !z.tags?.includes('wilderness') && z.id !== 'keys').map((z) => {
        const [x, y] = proj.project(centroid(z.polygons![0]));
        return (
          <text key={`l${z.id}`} x={x} y={y} className="map-zone-label" textAnchor="middle">
            {z.name.toUpperCase()}
          </text>
        );
      })}

      {cities.map((c) => {
        const [x, y] = proj.project(c.point!);
        const sel = selected === c.id;
        const left = c.tags?.includes('label-left');
        return (
          <g key={c.id} className="map-city" onClick={() => onSelect(c.id)}>
            <circle cx={x} cy={y} r={sel ? 6 : c.population > 150000 ? 4.5 : 3} className={sel ? 'selected' : ''} />
            <text x={left ? x - 7 : x + 7} y={y + 4} textAnchor={left ? 'end' : 'start'}>{c.name}</text>
            <title>{c.name}</title>
          </g>
        );
      })}

      <g className="map-scale" transform={`translate(20 ${proj.height - 24})`}>
        <line x1="0" y1="0" x2={scaleKm * proj.pxPerKm} y2="0" />
        <text x="0" y="-6">{scaleKm} km</text>
      </g>
      <text x={proj.width - 10} y={proj.height - 10} textAnchor="end" className="map-note">
        approximate geography · fictional scenario
      </text>
    </svg>
  );
}
