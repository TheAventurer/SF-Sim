import { useRef, useState } from 'react';
import {
  TIME_STEPS,
  advanceTurn,
  createWorld,
  deserializeWorld,
  formatLocal,
  serializeWorld,
  type LocationId,
  type TimeStep,
  type WorldState
} from '../engine';
import { SCENARIOS } from '../data/scenarios';
import { MapView } from './MapView';
import { EventLog, FactionPanel, LocationPanel } from './Panels';
import { downloadText, listSlots, readSlot, writeSlot } from './storage';

const QUICK_SLOT = 'quick';

export function App() {
  const [world, setWorld] = useState<WorldState>(() => createWorld(SCENARIOS[0]));
  const [step, setStep] = useState<TimeStep>('6h');
  const [faction, setFaction] = useState('SPC');
  const [location, setLocation] = useState<LocationId | null>('homestead');
  const [notice, setNotice] = useState<string>('');
  const fileInput = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState(listSlots);

  const say = (msg: string) => setNotice(msg);

  const loadText = (text: string, source: string) => {
    try {
      const save = deserializeWorld(text);
      setWorld(save.world);
      say(`Loaded ${source} · turn ${save.world.turn}`);
    } catch (e) {
      say(`Could not load ${source}: ${(e as Error).message}`);
    }
  };

  const quickSave = () => {
    const ok = writeSlot(QUICK_SLOT, serializeWorld(world, `Turn ${world.turn}`));
    setSlots(listSlots());
    say(ok ? `Saved to browser slot · turn ${world.turn}` : 'Browser storage is unavailable; use Export instead.');
  };

  const quickLoad = () => {
    const text = readSlot(QUICK_SLOT);
    if (text) loadText(text, 'browser slot');
    else say('No browser save yet.');
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    loadText(await file.text(), file.name);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="title">
          <div className="name">South Florida: Living History</div>
          <div className="eyebrow">Scenario · {world.scenarioName} (fictional)</div>
        </div>
        <div className="clock">
          <div className="mono big">{formatLocal(world.time)}</div>
          <div className="muted small">Turn {world.turn} · Observing</div>
        </div>
        <div className="steps" role="group" aria-label="Turn length">
          {TIME_STEPS.map((s) => (
            <button key={s.id} type="button" aria-pressed={step === s.id} className={step === s.id ? 'on' : ''} onClick={() => setStep(s.id)}>
              {s.id}
            </button>
          ))}
        </div>
        <button type="button" className="primary" onClick={() => setWorld((w) => advanceTurn(w, step))}>
          Advance {TIME_STEPS.find((s) => s.id === step)?.label}
        </button>
        <span className="spacer" />
        <div className="file-actions">
          <button type="button" onClick={quickSave}>Save</button>
          <button type="button" onClick={quickLoad} disabled={!slots.length}>Load</button>
          <button type="button" onClick={() => downloadText(`sf-sim-turn-${world.turn}.json`, serializeWorld(world, `Turn ${world.turn}`))}>Export</button>
          <button type="button" onClick={() => fileInput.current?.click()}>Import</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          <button type="button" onClick={() => { setWorld(createWorld(SCENARIOS[0])); say('Started a new game.'); }}>New</button>
        </div>
      </header>
      {notice && <div className="notice" role="status">{notice}</div>}

      <div className="body">
        <FactionPanel world={world} selected={faction} onSelect={setFaction} />
        <main className="map-wrap">
          <MapView world={world} selected={location} onSelect={setLocation} />
        </main>
        <aside className="panel right" aria-label="Location and events">
          <LocationPanel world={world} id={location} />
          <h2 className="eyebrow">Event log</h2>
          <EventLog world={world} />
        </aside>
      </div>
    </div>
  );
}
