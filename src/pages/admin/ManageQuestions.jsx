import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  Settings,
  X,
  Upload,
  AlertCircle,
  FileText,
  BookOpen,
  Layout,
  Code,
  FileJson
} from 'lucide-react';
import { useAlert } from '../../context/AlertProvider';
import * as XLSX from 'xlsx';

const ManageQuestions = ({ examId: initialExamId, onBack, onSubViewChange }) => {
  const { showAlert, confirm } = useAlert();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const editorPreRef = useRef(null);
  const editorTextareaRef = useRef(null);

  const handleEditorScroll = () => {
    if (editorTextareaRef.current && editorPreRef.current) {
      editorPreRef.current.scrollTop = editorTextareaRef.current.scrollTop;
    }
  };
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // New Exam Local State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDuration, setNewExamDuration] = useState('');

  // Add Question Local State
  const [newQuestion, setNewQuestion] = useState({ 
    question_text: '', 
    options: ['', '', '', ''], 
    correct_option: 0,
    explanation: ''
  });

  // Excel Upload State
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [isJsonPasteOpen, setIsJsonPasteOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
      
      if (initialExamId && !selectedExam) {
        const exam = data.find(e => e.id === initialExamId);
        if (exam) handleSelectExam(exam);
      }
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    if (!newExamTitle.trim() || !newExamDuration) {
       showAlert('Please provide both title and duration.', 'error');
       return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase.from('exams').insert({
        title: newExamTitle.trim(),
        duration: parseInt(newExamDuration)
      });
      if (error) throw error;
      showAlert('New exam created effectively.', 'success');
      setNewExamTitle('');
      setNewExamDuration('');
      fetchExams();
    } catch (e) {
      showAlert(e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteExam = (examId) => {
    confirm({
       title: 'Delete Exam?',
       message: 'Are you sure you want to delete this exam and all its questions? This action is permanent.',
       type: 'danger',
       confirmText: 'Delete Exam',
       onConfirm: async () => {
         const { error } = await supabase.from('exams').delete().eq('id', examId);
         if (error) showAlert(error.message, 'error');
         else {
           showAlert('Exam deleted successfully.', 'success');
           fetchExams();
         }
       }
    });
  };

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    onSubViewChange?.(true); // Tell parent to hide its header/tabs
    setLoading(true);
    try {
      const { data, error } = await supabase.from('questions').select('*').eq('exam_id', exam.id);
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToExams = () => {
    setSelectedExam(null);
    onSubViewChange?.(false); // Restore parent header/tabs
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question_text.trim() || newQuestion.options.some(o => !o.trim())) {
      showAlert('Please fill all question fields and options.', 'error');
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase.from('questions').insert({ 
        ...newQuestion, 
        exam_id: selectedExam.id 
      });
      if (error) throw error;
      showAlert('Question added successfully!', 'success');
      
      // Reset form
      setNewQuestion({ question_text: '', options: ['', '', '', ''], correct_option: 0, explanation: '' });
      handleSelectExam(selectedExam);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
     try {
       const { error } = await supabase.from('questions').delete().eq('id', id);
       if (error) throw error;
       setQuestions(prev => prev.filter(q => q.id !== id));
       showAlert('Question removed.', 'success');
     } catch (e) {
       showAlert(e.message, 'error');
     }
  };

  // --- EXCEL PARSING & DRAG/DROP LOGIC ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
       processFile(e.target.files[0]);
    }
    e.target.value = null; // reset
  };

  const processFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        processImportedData(jsonData);
      } catch (err) {
        console.error(err);
        showAlert('Failed to parse file. Please ensure it is a valid .xlsx or .csv format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const highlightJson = (code) => {
    if (!code) return '';
    
    const themes = ['text-indigo-400', 'text-emerald-400', 'text-amber-400', 'text-fuchsia-400', 'text-cyan-400', 'text-rose-400'];
    let themeIdx = -1;
    let level = 0;
    let result = '';
    
    // Escaping HTML characters
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Simple state machine for block highlighting
    for (let i = 0; i < escaped.length; i++) {
      const char = escaped[i];
      
      if (char === '{') {
        level++;
        if (level === 2) themeIdx = (themeIdx + 1) % themes.length;
      }
      
      const currentTheme = (level >= 2 && themeIdx !== -1) ? themes[themeIdx] : 'text-slate-500';
      result += `<span class="${currentTheme}">${char}</span>`;
      
      if (char === '}') {
        level--;
      }
    }
    
    return result;
  };

  const handleJsonPaste = () => {
    try {
      const parsed = JSON.parse(jsonPayload);
      let data = parsed;
      
      // Intelligent support for { "data": [...] } wrapper or direct array
      if (!Array.isArray(parsed) && parsed.data && Array.isArray(parsed.data)) {
        data = parsed.data;
      }

      if (!Array.isArray(data)) {
        throw new Error('Payload must be a JSON array of question objects or an object with a "data" array.');
      }
      
      processImportedData(data);
      setIsJsonPasteOpen(false);
      setJsonPayload('');
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const processImportedData = (rows) => {
    let parsed = [];
    let validCount = 0;

    // Intelligent Detection: Check if the dataset uses 1-based indexing (contains '4')
    const isOneBased = rows.some(row => {
      const keys = Object.keys(row);
      const match = keys.find(k => ['correct_option', 'correctoption', 'answer', 'correct', 'ans', 'right_option'].some(p => k.toLowerCase().trim().includes(p)));
      return match && String(row[match]).trim() === '4';
    });
    
    rows.forEach((row, i) => {
      // Find properties with intelligent case-insensitive and fuzzy mapping
      const keys = Object.keys(row);
      const getVal = (possible) => {
        const match = keys.find(k => possible.some(p => k.toLowerCase().trim().includes(p)));
        return match ? row[match] : '';
      };

      const qText = getVal(['question', 'question_text', 'text', 'q_text', 'qtext']);
      
      // Intelligent Options Detection
      let opts = ['', '', '', ''];
      if (Array.isArray(row.options) && row.options.length >= 2) {
        opts = [...row.options, '', '', ''].slice(0, 4);
      } else {
        opts[0] = String(getVal(['opt1', 'option_a', 'option 1', 'optiona', 'choice1', 'choice_a']) || '');
        opts[1] = String(getVal(['opt2', 'option_b', 'option 2', 'optionb', 'choice2', 'choice_b']) || '');
        opts[2] = String(getVal(['opt3', 'option_c', 'option 3', 'optionc', 'choice3', 'choice_c']) || '');
        opts[3] = String(getVal(['opt4', 'option_d', 'option 4', 'optiond', 'choice4', 'choice_d']) || '');
      }

      const rawAns = getVal(['correct_option', 'correctoption', 'answer', 'correct', 'ans', 'right_option']);
      const exp = getVal(['description', 'explanation', 'desc', 'info']);

      const optsFull = opts.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
      
      let cidx = -1;
      let error = '';

      if (!qText) {
         error = 'Missing Question text.';
      } else if (optsFull.length < 2) {
         error = 'At least 2 options are required.';
      } else if (rawAns === undefined || rawAns === '') {
         error = 'Missing Correct Answer.';
      } else {
        let ansStr = String(rawAns).trim().toLowerCase();
        
        // Intelligent Answer Mapping
        // 1. Index based (handles both 0-3 and 1-4 automatically)
        if (['0','1','2','3','4'].includes(ansStr)) {
           const num = parseInt(ansStr);
           if (isOneBased && num > 0) {
              cidx = num - 1;
           } else {
              cidx = num;
           }
        }
        // 2. Alpha based (a, b, c, d)
        else if (['a','b','c','d'].includes(ansStr)) {
           cidx = ['a','b','c','d'].indexOf(ansStr);
        }
        // 3. Exact String Match (Smart Search)
        else {
           const exactIdx = opts.findIndex(opt => String(opt).trim().toLowerCase() === ansStr);
           if (exactIdx !== -1) {
             cidx = exactIdx;
           } else {
             // 4. Fuzzy Letter Match (e.g. "Option A", "A.")
             const letterMatch = ansStr.match(/^[a-d][\s.)]*/);
             if (letterMatch) {
                cidx = ['a','b','c','d'].indexOf(letterMatch[0][0]);
             } else {
                error = `Invalid Answer: "${rawAns}". Could not map to any option.`;
             }
           }
        }
      }

      parsed.push({
        _internal_id: i,
        rowNum: i + 1,
        question_text: String(qText || ''),
        options: opts.map(o => String(o || '')),
        correct_option: cidx !== -1 ? cidx : 0,
        explanation: String(exp || ''),
        valid: error === '',
        error_msg: error
      });
      
      if (error === '') validCount++;
    });

    setParsedData({ rows: parsed, validCount, total: parsed.length });
    setIsExcelPreviewOpen(true);
  };

  const handleSaveBulkUpload = async () => {
    if (!parsedData) return;
    
    // Only save valid rows
    let rowsToSave = parsedData.rows.filter(r => r.valid).map(r => ({
       exam_id: selectedExam.id,
       question_text: r.question_text,
       options: [...r.options],
       correct_option: r.correct_option,
       explanation: r.explanation
    }));

    // Randomization Flags
    if (shuffleOptions) {
        rowsToSave = rowsToSave.map(row => {
            const tempOpts = row.options.map((text, idx) => ({ text, isCorrect: idx === row.correct_option }));
            tempOpts.sort(() => Math.random() - 0.5);
            return {
                ...row,
                options: tempOpts.map(o => o.text),
                correct_option: tempOpts.findIndex(o => o.isCorrect)
            };
        });
    }

    if (shuffleQuestions) {
        rowsToSave.sort(() => Math.random() - 0.5);
    }

    setProcessing(true);
    try {
      const { error } = await supabase.from('questions').insert(rowsToSave);
      if (error) throw error;
      
      showAlert(`Successfully imported ${rowsToSave.length} questions.`, 'success');
      setIsExcelPreviewOpen(false);
      setParsedData(null);
      handleSelectExam(selectedExam);
    } catch (e) {
      showAlert(e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };


  // --- VIEWS ---

  if (selectedExam) {
    return (
      <div 
        className={`space-y-8 animate-fade-in pb-20 relative transition-colors ${isDragging ? 'bg-indigo-50/30' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
         {isDragging && (
           <div className="absolute inset-0 z-50 border-4 border-dashed border-indigo-500 bg-indigo-50/80 rounded-[3rem] flex items-center justify-center backdrop-blur-sm pointer-events-none">
              <div className="flex flex-col items-center justify-center text-indigo-600 bg-white p-10 rounded-3xl shadow-2xl">
                 <Upload className="w-16 h-16 mb-4 animate-bounce" />
                 <h2 className="text-3xl font-black tracking-tight">Drop Excel File Here</h2>
                 <p className="text-indigo-400 font-bold mt-2">Automatically mapping columns & answers...</p>
              </div>
           </div>
         )}
         
         {/* HEADER */}
         <div className="flex items-center gap-4 relative z-10">
            <button onClick={handleBackToExams} className="flex items-center gap-2 text-indigo-500 font-bold hover:text-indigo-700 transition-colors bg-indigo-50 px-4 py-2 rounded-full text-sm">
               <ArrowLeft className="w-4 h-4"/> Back to Exams
            </button>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedExam.title} <span className="text-slate-400 font-medium ml-1">Questions</span></h2>
            
            <div className="ml-auto flex items-center gap-4">
               <button 
                 onClick={() => setIsJsonPasteOpen(true)} 
                 className="group relative overflow-hidden bg-slate-900 text-white font-black py-3.5 px-7 rounded-[18px] flex items-center gap-2.5 transition-all hover:shadow-[0_10px_30px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 active:scale-95"
               >
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <FileJson className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" /> 
                 <span className="text-[13px] tracking-tight">Paste JSON</span>
               </button>

               <label className="group relative overflow-hidden bg-white text-slate-800 font-black py-3.5 px-7 rounded-[18px] flex items-center gap-2.5 cursor-pointer border border-slate-200 shadow-sm transition-all hover:border-indigo-400 hover:shadow-[0_10px_30px_rgba(79,70,229,0.1)] hover:-translate-y-0.5 active:scale-95">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Upload className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" /> 
                 <span className="text-[13px] tracking-tight">Upload Excel/CSV</span>
                 <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" />
               </label>
            </div>
         </div>

         <div className="grid lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Single Question Form */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                   <div className="flex items-center gap-2 mb-6">
                      <div className="bg-slate-100 p-1.5 rounded text-blue-500 font-bold"><Plus className="w-4 h-4"/></div>
                      <h3 className="font-bold text-lg text-slate-800 tracking-tight">Add Single Question</h3>
                   </div>
                   
                   <form onSubmit={handleAddQuestion} className="space-y-5">
                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Question Text</label>
                         <textarea 
                           className="input-premium w-full !bg-slate-50 min-h-[100px] leading-relaxed resize-none" 
                           placeholder="Enter question text here..."
                           value={newQuestion.question_text}
                           onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
                         />
                      </div>
                      
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 block">Options</label>
                         {newQuestion.options.map((opt, i) => (
                           <div className="relative flex items-center" key={i}>
                              <div className="absolute left-4 font-bold text-slate-400">{String.fromCharCode(65+i)}</div>
                              <input 
                                className="input-premium w-full !pl-10 !bg-slate-50" 
                                placeholder={`Option ${String.fromCharCode(65+i)}`}
                                value={opt}
                                onChange={e => {
                                  const n = [...newQuestion.options];
                                  n[i] = e.target.value;
                                  setNewQuestion({...newQuestion, options: n});
                                }}
                              />
                           </div>
                         ))}
                      </div>

                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Correct Option</label>
                         <div className="relative">
                           <select 
                             className="input-premium w-full !bg-slate-50 appearance-none font-medium"
                             value={newQuestion.correct_option}
                             onChange={e => setNewQuestion({...newQuestion, correct_option: parseInt(e.target.value)})}
                           >
                              {newQuestion.options.map((_, i) => (
                                 <option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>
                              ))}
                           </select>
                         </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Explanation (Optional)</label>
                         <textarea 
                           className="input-premium w-full !bg-slate-50 min-h-[80px] resize-none" 
                           placeholder="Optional explanation for the correct answer..."
                           value={newQuestion.explanation || ''}
                           onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                         />
                      </div>

                      <button disabled={processing} className="w-full bg-[#825dfa] hover:bg-[#6c48e8] text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all">
                        {processing ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : 'Add Question +'}
                      </button>
                   </form>
                </div>

                {/* Info Card mimicking screenshot helper bounds */}
                <div className="bg-[#f8fafc] border border-slate-200 rounded-[20px] p-6 text-sm">
                   <h4 className="font-bold flex items-center gap-2 text-blue-600 mb-4 tracking-tight"><FileText className="w-4 h-4"/> Excel Format (.xlsx)</h4>
                   <p className="text-slate-500 text-xs mb-3 font-medium">Supported Column Headers (Any of these sets):</p>
                   <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">question</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">opt1</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">opt2</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">correct_option</span>
                   </div>
                   <div className="flex gap-2 mb-4">
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Question</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Option A</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Option B</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Answer</span>
                   </div>
                   <p className="text-xs text-slate-400 italic font-medium">* Answer can be A/B/C/D, 0-3, or exact option text.</p>
                </div>
            </div>

            {/* RIGHT COLUMN: Question List */}
            <div className="lg:col-span-7 flex flex-col pt-1">
               <div className="flex justify-between items-center mb-5 pl-2">
                  <h3 className="font-black text-slate-800">Existing Questions</h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold ring-1 ring-indigo-500/20">{questions.length} Added</span>
               </div>
               
               <div className="bg-slate-50/50 flex-1 rounded-[24px] border border-slate-100 p-6 flex flex-col gap-4 relative">
                  {loading ? (
                     <div className="m-auto flex flex-col justify-center items-center py-20 opacity-70">
                         <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                         <p className="font-bold text-slate-500">Syncing Question Bank...</p>
                     </div>
                  ) : questions.length === 0 ? (
                     <div className="m-auto text-center flex flex-col items-center opacity-60 py-20">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-[20px] flex items-center justify-center mb-4 shadow-sm">
                           <Layout className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-bold mb-1">No questions added for this exam yet.</p>
                        <p className="text-sm text-slate-400 font-medium">Use the left form or drag & drop an Excel file.</p>
                     </div>
                  ) : (
                     questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5 hover:shadow-md transition-shadow relative group">
                           <button onClick={() => handleDeleteQuestion(q.id)} className="absolute right-4 top-4 p-2 text-rose-300 hover:text-white hover:bg-rose-500 bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-4 h-4" />
                           </button>
                           
                           <div className="pr-10">
                              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-2 block">Question {idx + 1}</span>
                              <h4 className="font-bold text-slate-800 leading-relaxed text-sm">{q.question_text}</h4>
                           </div>
                           
                           <div className="space-y-2">
                              {q.options.map((o, oIdx) => (
                                 <div key={oIdx} className={`p-3 rounded-xl border flex gap-3 text-sm transition-colors ${q.correct_option === oIdx ? 'bg-indigo-500/5 border-indigo-200 font-medium text-indigo-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold text-[10px] border ${q.correct_option === oIdx ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white border-slate-300'}`}>
                                       {String.fromCharCode(65+oIdx)}
                                    </div>
                                    <span>{o}</span>
                                 </div>
                              ))}
                           </div>
                           {q.explanation && (
                              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg flex gap-2"><CheckCircle className="w-4 h-4 shrink-0 text-emerald-500"/> {q.explanation}</p>
                           )}
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>

         {/* JSON PASTE MODAL */}
         <AnimatePresence>
            {isJsonPasteOpen && (
              <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                <motion.div 
                  initial={{opacity:0}} 
                  animate={{opacity:1}} 
                  exit={{opacity:0}} 
                  onClick={() => setIsJsonPasteOpen(false)} 
                  className="absolute inset-0 bg-slate-950/40 backdrop-blur-md shadow-2xl" 
                />
                <motion.div 
                  initial={{scale:0.9, y:40, opacity:0}} 
                  animate={{scale:1, y:0, opacity:1}} 
                  exit={{scale:0.9, y:40, opacity:0}} 
                  className="bg-[#0b0f1a] max-w-3xl w-full rounded-[2.5rem] flex flex-col overflow-hidden relative z-10 shadow-[0_0_100px_rgba(79,70,229,0.2)] border border-slate-800/50"
                >
                   {/* EDITOR HEADER - VIBRANT NEON */}
                   <div className="px-8 py-7 border-b border-white/5 bg-gradient-to-r from-indigo-900/40 via-fuchsia-900/20 to-transparent flex justify-between items-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" />
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-[20px] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] ring-4 ring-indigo-500/10">
                            <FileJson className="w-7 h-7 text-white" />
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">Payload Editor <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-tighter ml-1">JSON v2</span></h3>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-75" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse delay-150" />
                               </div>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Intelligent Syntax Mapping</span>
                            </div>
                         </div>
                      </div>
                      <button onClick={() => setIsJsonPasteOpen(false)} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all group active:scale-90">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                   </div>

                   <div className="p-8 relative bg-[#0b0f1a] flex-1 overflow-hidden">
                      <div className="absolute left-10 top-8 bottom-8 w-[1px] bg-indigo-500/20 z-20" />
                      
                      <div className="relative w-full h-[450px]">
                         {/* PRE - THE HIGHLIGHTED LAYER */}
                         <pre 
                           ref={editorPreRef}
                           className="absolute inset-0 pl-12 pr-6 py-0 m-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden font-mono text-[14px] leading-[22px] tracking-tight text-slate-500 select-none border-none bg-transparent"
                           dangerouslySetInnerHTML={{ __html: highlightJson(jsonPayload) || '<span class="opacity-30">Waiting for payload...</span>' }}
                         />
                         
                         {/* TEXTAREA - THE INPUT LAYER */}
                         <textarea 
                           ref={editorTextareaRef}
                           onScroll={handleEditorScroll}
                           className="absolute inset-0 pl-12 pr-6 py-0 bg-transparent text-transparent caret-fuchsia-400 font-mono text-[14px] leading-[22px] tracking-tight focus:outline-none resize-none custom-scrollbar selection:bg-fuchsia-500/30 overflow-y-auto border-none w-full h-full"
                           spellCheck="false"
                           placeholder='{
  "title": "Exam Title",
  "data": [
    {
      "question": "Sample Question?",
      "options": ["A", "B", "C", "D"],
      "answer": 1
    }
  ]
}'
                           value={jsonPayload}
                           onChange={e => setJsonPayload(e.target.value)}
                         />
                      </div>
                   </div>

                   <div className="px-10 py-8 border-t border-white/5 bg-[#1e293b]/10 flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Compiler Status</p>
                         <p className="text-[12px] font-medium text-indigo-400/80 italic">Ready for smart injection...</p>
                      </div>
                      <div className="flex gap-5">
                         <button 
                           onClick={() => setIsJsonPasteOpen(false)} 
                           className="px-8 py-4 rounded-2xl font-black text-slate-500 hover:text-white transition-all text-xs uppercase tracking-widest"
                         >
                           Discard
                         </button>
                         <button 
                           onClick={handleJsonPaste} 
                           disabled={!jsonPayload.trim()} 
                           className="group relative px-12 py-4 rounded-2xl font-black text-white overflow-hidden transition-all active:scale-95 disabled:opacity-30"
                         >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-fuchsia-600 group-hover:from-indigo-500 group-hover:to-fuchsia-500 transition-all" />
                            <div className="absolute inset-0 bg-[rgba(255,255,255,0.1)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 flex items-center gap-2 text-xs uppercase tracking-[0.15em]">
                               Compile & Process <ArrowLeft className="w-4 h-4 rotate-180" />
                            </span>
                         </button>
                      </div>
                   </div>
                </motion.div>
              </div>
            )}
         </AnimatePresence>

         {/* EXCEL/CSV PREVIEW MODAL */}
         <AnimatePresence>
            {isExcelPreviewOpen && parsedData && (
              <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                <motion.div 
                  initial={{opacity:0}} 
                  animate={{opacity:1}} 
                  exit={{opacity:0}} 
                  onClick={() => setIsExcelPreviewOpen(false)} 
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-2xl" 
                />
                
                <motion.div 
                  initial={{scale:0.95, y:20, opacity:0}} 
                  animate={{scale:1, y:0, opacity:1}} 
                  exit={{scale:0.95, y:20, opacity:0}} 
                  transition={{ duration: 0.15, ease: 'easeOut' }} 
                  className="bg-white max-w-5xl w-full h-[85vh] rounded-[2.5rem] flex flex-col overflow-hidden relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-slate-200"
                >
                   <div className="px-10 py-7 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                            <Upload className="w-7 h-7 text-indigo-600" />
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Validation Output</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Found {parsedData.total} questions • Review before final injection</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="text-center px-4 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                            <span className="block text-xl font-black text-emerald-600 leading-none">{parsedData.validCount}</span>
                            <span className="text-[10px] font-black uppercase text-emerald-600/70">Valid</span>
                         </div>
                         <div className="text-center px-4 py-1.5 bg-rose-50 rounded-xl border border-rose-100">
                            <span className="block text-xl font-black text-rose-600 leading-none">{parsedData.total - parsedData.validCount}</span>
                            <span className="text-[10px] font-black uppercase text-rose-600/70">Invalid</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar space-y-6">
                      {parsedData.rows.map((row, idx) => {
                         const isValid = row.valid;
                         
                         return (
                            <div key={row._internal_id} className={`p-6 bg-white rounded-[1.5rem] border transition-all ${isValid ? 'border-slate-100 shadow-sm hover:shadow-md' : 'border-rose-100 bg-rose-50/30'}`}>
                               <div className="flex justify-between items-start mb-5">
                                  <div className="flex items-center gap-4">
                                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${isValid ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-500'}`}>ITEM {row.rowNum}</span>
                                     {!isValid && (
                                        <span className="flex items-center gap-2 text-[10px] font-black text-rose-500 bg-rose-100/50 px-3 py-1 rounded-lg border border-rose-200 uppercase tracking-widest">
                                           <AlertCircle className="w-3 h-3"/> {row.error_msg}
                                        </span>
                                     )}
                                  </div>
                                  {isValid && <CheckCircle className="w-6 h-6 text-emerald-500 opacity-80" />}
                               </div>
                               
                               <h4 className={`font-bold text-[15px] leading-relaxed mb-6 ${isValid ? 'text-slate-800' : 'text-rose-900'}`}>
                                  <span className="mr-2 text-slate-300 font-mono text-xs">{idx + 1}.</span>
                                  {row.question_text || '(Empty Question Statement)'}
                                </h4>
                               
                               <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {row.options.map((opt, i) => {
                                     const isCorrect = isValid && row.correct_option === i;
                                     return (
                                        <div 
                                          key={i} 
                                          className={`p-3.5 rounded-xl border text-[12px] leading-relaxed transition-all flex items-start gap-3 ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-500/10' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                        >
                                           <span className={`font-black ${isCorrect ? 'text-emerald-500' : 'text-slate-300'}`}>{String.fromCharCode(65+i)}</span>
                                           <span className={isCorrect ? 'font-bold' : 'font-medium'}>{opt}</span>
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>
                         );
                      })}
                   </div>

                   <div className="px-10 py-7 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                      <div className="flex gap-8">
                         <label className="flex items-center gap-3 text-xs font-black text-slate-400 cursor-pointer select-none hover:text-indigo-600 transition-colors uppercase tracking-widest">
                           <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-500 bg-slate-50 border-slate-200 focus:ring-offset-0 focus:ring-transparent" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} />
                           Shuffle Items
                         </label>
                         <label className="flex items-center gap-3 text-xs font-black text-slate-400 cursor-pointer select-none hover:text-indigo-600 transition-colors uppercase tracking-widest">
                           <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-500 bg-slate-50 border-slate-200 focus:ring-offset-0 focus:ring-transparent" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
                           Randomize Options
                         </label>
                      </div>
                      
                      <div className="flex gap-4">
                         <button disabled={processing} onClick={() => setIsExcelPreviewOpen(false)} className="px-8 py-4 rounded-xl font-black text-slate-400 hover:text-slate-600 transition-all text-xs uppercase tracking-widest">Discard</button>
                         <button disabled={processing || parsedData.validCount === 0} onClick={handleSaveBulkUpload} className="px-10 py-4 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95 text-xs uppercase tracking-[0.1em]">
                            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : `Import ${parsedData.validCount} Questions`}
                         </button>
                      </div>
                   </div>
                </motion.div>
              </div>
            )}
         </AnimatePresence>
      </div>
    );
  }

  // EXAM OVERVIEW (Admin Dashboard Screenshot 1 integration)
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-slate-100 border-t-4 border-t-indigo-500 flex flex-col md:flex-row gap-8 items-center">
         <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
            <Plus className="text-indigo-500 w-6 h-6" strokeWidth={3}/>
         </div>
         <div className="flex-1 w-full flex flex-col gap-6 md:flex-row">
            <div className="flex-1">
               <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-4 hidden md:block">Create New Exam</h3>
               <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-2 block tracking-widest">Exam Title</label>
               <input className="input-premium w-full !bg-slate-50 !py-3.5 !rounded-2xl border-transparent hover:border-slate-200" placeholder="e.g. Advanced Data Structures Midterm" value={newExamTitle} onChange={e => setNewExamTitle(e.target.value)}/>
            </div>
            <div className="w-full md:w-48 xl:w-64">
               <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-4 opacity-0 hidden md:block">Spacer</h3>
               <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-2 block tracking-widest">Duration (Minutes)</label>
               <input className="input-premium w-full !bg-slate-50 !py-3.5 !rounded-2xl border-transparent hover:border-slate-200" type="number" placeholder="e.g. 60" value={newExamDuration} onChange={e => setNewExamDuration(e.target.value)}/>
            </div>
         </div>
         <button disabled={processing} onClick={handleCreateExam} className="bg-[#825dfa] hover:bg-[#6e4ade] text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-purple-500/20 transition-all shrink-0 mt-auto flex items-center gap-2 self-stretch md:self-auto h-max">
            {processing && !newExamTitle ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Create Exam +'}
         </button>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-6 ml-2">
           <h3 className="text-[26px] font-black text-slate-800 tracking-tight">All Exams</h3>
           <span className="px-4 py-1.5 bg-indigo-50/80 text-indigo-600 rounded-full text-xs font-bold ring-1 ring-indigo-500/20 shadow-sm">{exams.length} Total</span>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : exams.length === 0 ? (
           <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
             <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-bold">No exams created yet.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
             {exams.map(exam => (
                <div key={exam.id} className="bg-white p-5 rounded-[22px] shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col group hover:border-indigo-200 hover:shadow-lg transition-all ring-1 ring-transparent hover:ring-indigo-100/50">
                   <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-inner shrink-0">
                         <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                         <Clock className="w-3 h-3 text-indigo-500" /> {exam.duration}m
                      </div>
                   </div>
                   <h4 className="font-black text-[15px] text-slate-900 mb-6 leading-tight group-hover:text-indigo-600 transition-colors break-words">{exam.title}</h4>
                   <div className="mt-auto flex gap-2">
                      <button onClick={() => handleSelectExam(exam)} className="flex-1 bg-[#1e58f0] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-[11px] transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10 active:scale-95">
                         <Settings className="w-3.5 h-3.5"/> Manage
                      </button>
                      <button onClick={() => handleDeleteExam(exam.id)} className="flex-1 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white font-bold py-2.5 rounded-xl text-[11px] transition-all flex items-center justify-center gap-2 group/delete active:scale-95">
                         <Trash2 className="w-3.5 h-3.5 group-hover/delete:scale-110 transition-transform"/> Delete
                      </button>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageQuestions;
