
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { runAllTests, TestResult, TestLogEntry } from '../services/physicsTests';
import { DEFAULT_CAR_CONFIG } from '../constants';

interface UnitTestsProps {
  onClose: () => void;
}

export const UnitTests: React.FC<UnitTestsProps> = ({ onClose }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResults([]);
    setSelectedTestId(null);
    
    // Run tests
    const data = await runAllTests();
    setResults(data);
    setIsRunning(false);
    
    // Auto-select first failure, or first test
    const firstFail = data.find(r => !r.passed);
    if (firstFail) setSelectedTestId(firstFail.id);
    else if (data.length > 0) setSelectedTestId(data[0].id);
  };

  useEffect(() => {
    handleRun();
  }, []);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTestId]);

  // Group Results Logic
  const groupedResults = useMemo(() => {
      const groups: Record<string, TestResult[]> = {
          '动力系统 (Engine)': [],
          '传动系统 (Transmission)': [],
          '车辆动力学 (Dynamics)': [],
          '其他 (Misc)': []
      };

      results.forEach(test => {
          if (test.id.startsWith('ENG')) groups['动力系统 (Engine)'].push(test);
          else if (test.id.startsWith('TRN')) groups['传动系统 (Transmission)'].push(test);
          else if (test.id.startsWith('DYN')) groups['车辆动力学 (Dynamics)'].push(test);
          else groups['其他 (Misc)'].push(test);
      });

      // Filter out empty groups
      return Object.entries(groups).filter(([_, tests]) => tests.length > 0);
  }, [results]);

  const selectedTest = results.find(r => r.id === selectedTestId);
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur z-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-6xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    系统诊断控制台
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                    PHYSICS ENGINE DIAGNOSTICS | CONFIG: <span className="text-blue-400">{DEFAULT_CAR_CONFIG.name}</span>
                </span>
             </div>
             
             {/* Stats Pills */}
             {!isRunning && results.length > 0 && (
                 <div className="flex gap-2 ml-4">
                     <div className="px-3 py-1 bg-green-900/30 border border-green-700 rounded text-green-400 text-xs font-bold">
                         PASSED: {passCount}
                     </div>
                     <div className={`px-3 py-1 border rounded text-xs font-bold ${failCount > 0 ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                         FAILED: {failCount}
                     </div>
                 </div>
             )}
          </div>

          <div className="flex gap-3">
            <button 
                onClick={handleRun} 
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-bold transition-colors flex items-center gap-2"
            >
                {isRunning ? <span className="animate-spin">⟳</span> : '⟲'} 重新运行
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">
                关闭
            </button>
          </div>
        </div>

        {/* Main Content: Split View */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Left: Test List (Grouped) */}
            <div className="w-1/3 border-r border-slate-700 bg-slate-800/50 flex flex-col overflow-y-auto">
                {isRunning && results.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 animate-pulse">Running Test Suite...</div>
                ) : (
                    groupedResults.map(([category, groupTests]) => (
                        <div key={category}>
                            {/* Sticky Header for Group */}
                            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-t border-slate-700/80 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm flex justify-between">
                                <span>{category}</span>
                                <span className="text-slate-600">{groupTests.length} CASES</span>
                            </div>
                            
                            {groupTests.map(test => (
                                <button
                                    key={test.id}
                                    onClick={() => setSelectedTestId(test.id)}
                                    className={`w-full p-4 text-left border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors group relative ${
                                        selectedTestId === test.id 
                                        ? 'bg-blue-900/20' 
                                        : ''
                                    }`}
                                >
                                    {/* Active Indicator Line */}
                                    {selectedTestId === test.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                    )}

                                    <div className="flex justify-between items-start mb-1 pl-2">
                                        <span className={`font-bold text-sm font-mono ${test.passed ? 'text-slate-200' : 'text-red-400'}`}>
                                            <span className="text-slate-500 mr-2 text-xs opacity-70">{test.id}</span>
                                        </span>
                                        {test.passed ? (
                                            <span className="text-green-500 text-[10px] font-bold bg-green-900/20 px-1.5 py-0.5 rounded border border-green-800/50">PASS</span>
                                        ) : (
                                            <span className="text-red-500 text-[10px] font-bold bg-red-900/20 px-1.5 py-0.5 rounded border border-red-800/50">FAIL</span>
                                        )}
                                    </div>
                                    <div className={`text-sm font-semibold mb-1 pl-2 ${test.passed ? 'text-slate-300' : 'text-red-300'}`}>
                                        {test.name}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate group-hover:text-slate-400 pl-2 opacity-80">{test.description}</div>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Right: Detailed Logs */}
            <div className="w-2/3 bg-[#0a0f1e] flex flex-col font-mono text-sm relative">
                {selectedTest ? (
                    <>
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400 font-mono font-bold">
                                    {selectedTest.id}
                                </span>
                                <h3 className="text-lg font-bold text-slate-200">{selectedTest.name}</h3>
                            </div>
                            
                            <p className="text-slate-400 text-xs">{selectedTest.description}</p>
                            
                            {!selectedTest.passed && selectedTest.error && (
                                <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-xs">
                                    <strong className="block mb-1">ERROR:</strong>
                                    {selectedTest.error}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
                            {selectedTest.logs.map((log, idx) => (
                                <LogEntryItem key={idx} log={log} />
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600">
                        Select a test to view details
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

// Helper component for log entries
const LogEntryItem: React.FC<{ log: TestLogEntry }> = ({ log }) => {
    let colorClass = 'text-slate-400';
    let icon = '•';
    let bgClass = 'hover:bg-white/5';

    switch (log.type) {
        case 'action': 
            colorClass = 'text-blue-300 font-bold'; 
            icon = '➜'; 
            bgClass = 'bg-blue-900/10 hover:bg-blue-900/20 border-l-2 border-blue-500/50'; 
            break;
        case 'pass': 
            colorClass = 'text-green-400 font-bold'; 
            icon = '✓'; 
            break;
        case 'fail': 
            colorClass = 'text-red-400 font-bold'; 
            icon = '✗'; 
            bgClass = 'bg-red-900/10 hover:bg-red-900/20 border-l-2 border-red-500/50';
            break;
        case 'info': 
            colorClass = 'text-slate-500'; 
            icon = 'i'; 
            break;
    }

    return (
        <div className={`flex gap-3 py-1.5 px-2 rounded-sm transition-colors ${bgClass}`}>
            <span className="text-slate-700 w-8 shrink-0 text-right select-none text-xs pt-0.5">{log.frame}</span>
            <span className={`${colorClass} w-4 text-center shrink-0 select-none`}>{icon}</span>
            <div className="flex-1 break-all">
                <span className={colorClass}>{log.message}</span>
                {log.data && (
                    <div className="mt-1 ml-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                        {Object.entries(log.data).map(([k, v]) => (
                            <div key={k}>
                                <span className="text-slate-600 mr-1">{k}:</span>
                                <span className="text-slate-300">{v.toString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
