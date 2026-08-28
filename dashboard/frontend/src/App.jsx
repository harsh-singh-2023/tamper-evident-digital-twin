import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { ShieldCheck, ShieldAlert, Activity, Cpu, Server, Clock } from 'lucide-react';

const SOCKET_SERVER_URL = 'http://localhost:4000';

function App() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('state_update', (eventData) => {
      setEvents((prevEvents) => [eventData, ...prevEvents].slice(0, 50)); // Keep last 50
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12 selection:bg-indigo-500/30">
      <header className="mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
            Digital Twin Security Monitor
          </h1>
          <p className="text-slate-400 font-medium flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-emerald-400" />
            Live Tamper-Evident Synchronization Feed
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800/60 backdrop-blur-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'} animate-pulse`} />
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            {connected ? 'NETWORK SECURE' : 'DISCONNECTED'}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 gap-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-500">
            <Cpu className="w-12 h-12 mb-4 opacity-50" />
            <p>Waiting for sensor telemetry...</p>
          </div>
        ) : (
          events.map((evt) => (
            <div 
              key={evt.id} 
              className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500 hover:shadow-2xl ${
                evt.isMismatch 
                  ? 'bg-rose-950/20 border-rose-900/50 hover:bg-rose-950/40 hover:border-rose-500/50' 
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-indigo-500/50'
              }`}
            >
              {/* Decorative accent line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${evt.isMismatch ? 'bg-gradient-to-b from-rose-500 to-orange-500' : 'bg-gradient-to-b from-emerald-400 to-cyan-500'}`} />

              <div className="p-6 md:p-8 pl-8 md:pl-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Status Icon */}
                <div className="lg:col-span-1 flex justify-center">
                  {evt.isMismatch ? (
                    <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20">
                      <ShieldAlert className="w-8 h-8 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    </div>
                  )}
                </div>

                {/* Main Details */}
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {evt.device_id}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {format(new Date(evt.timestamp), 'HH:mm:ss.SSS')}
                    </span>
                  </div>
                  <h3 className={`text-xl font-bold ${evt.isMismatch ? 'text-rose-400' : 'text-slate-100'}`}>
                    {evt.isMismatch ? 'Integrity Violation Detected' : 'State Verified'}
                  </h3>
                  {evt.attackType !== 'none' && (
                     <p className="text-sm font-medium text-orange-400 mt-1 flex items-center gap-1">
                       ⚠️ Simulated Attack: {evt.attackType.toUpperCase()}
                     </p>
                  )}
                </div>

                {/* Hash Comparison */}
                <div className="lg:col-span-5 flex flex-col gap-3 font-mono text-[10px] md:text-xs">
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                    <div className="text-slate-500 mb-1 flex items-center justify-between">
                      <span>Computed Hash (from Payload)</span>
                      <Server className="w-3 h-3" />
                    </div>
                    <div className="truncate text-slate-300">{evt.computedHash}</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${evt.isMismatch ? 'bg-rose-950/40 border-rose-900/50' : 'bg-emerald-950/20 border-emerald-900/30'}`}>
                    <div className="text-slate-500 mb-1 flex items-center justify-between">
                      <span className={evt.isMismatch ? 'text-rose-400/70' : 'text-emerald-400/70'}>Expected Hash (from Ledger)</span>
                      <ShieldCheck className={`w-3 h-3 ${evt.isMismatch ? 'text-rose-400/70' : 'text-emerald-400/70'}`} />
                    </div>
                    <div className={`truncate ${evt.isMismatch ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {evt.onChainHash}
                    </div>
                  </div>
                </div>

                {/* Latency */}
                <div className="lg:col-span-2 flex flex-col items-end justify-center">
                  {evt.isMismatch && evt.latencyMs !== null ? (
                    <div className="text-right">
                      <div className="text-3xl font-black text-rose-500 drop-shadow-md">
                        {evt.latencyMs}<span className="text-lg text-rose-500/70 ml-1">ms</span>
                      </div>
                      <div className="text-xs font-bold text-rose-500/60 uppercase tracking-widest mt-1">Detection Latency</div>
                    </div>
                  ) : (
                    <div className="text-right">
                       <div className="text-2xl font-bold text-slate-600">—</div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default App;
