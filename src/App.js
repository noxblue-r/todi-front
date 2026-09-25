import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'https://todi-production-6cad.up.railway.app/api';

const C = {
  bg: '#FFF0F5',
  card: '#FFFFFF',
  border: '#FFE4F0',
  pink: '#FF8FAB',
  pinkLight: '#FFB6C1',
  pinkDark: '#FF5C8A',
  lavender: '#C9A7FF',
  text: '#333344',
  muted: '#AAAACC',
  white: '#FFFFFF',
};

const PRIORITY_COLOR = { HIGH: '#FF5C8A', MEDIUM: '#FFD93D', LOW: '#A8E6CF' };

const defaultForm = {
  title: '', memo: '', category: '', priority: 'MEDIUM',
  dueDate: new Date().toISOString().split('T')[0],
  isRoutine: false, subject: '', studyType: 'ETC', estimatedTime: 0
};

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('todi_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [tab, setTab] = useState('home');
  const [todos, setTodos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API}/todos`);
      setTodos(res.data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    }
  };

  useEffect(() => {
    if (user) fetchTodos();
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('todi_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('todi_user');
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const addTodo = async () => {
    if (!form.title.trim()) return;
    try {
      await axios.post(`${API}/todos`, { ...form, nickname: user.nickname });
      setForm(defaultForm);
      setShowForm(false);
      fetchTodos();
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  };

  const toggleComplete = async (id) => {
    try {
      await axios.patch(`${API}/todos/${id}/complete`);
      fetchTodos();
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API}/todos/${id}`);
      fetchTodos();
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTodos = todos.filter(t => t.dueDate === todayStr);
  const selectedTodos = todos.filter(t => t.dueDate === selectedDate);
  const completed = todayTodos.filter(t => t.completed);
  const rate = todayTodos.length === 0 ? 0 : Math.round((completed.length / todayTodos.length) * 100);

  return (
      <div style={{background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', fontFamily: '-apple-system, sans-serif', color: C.text}}>

        {/* 헤더 */}
        <div style={{background: 'linear-gradient(160deg, #FFE8F2 0%, #F0E4FF 100%)', padding: '48px 20px 16px', borderBottom: `1px solid ${C.border}`}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
            <div style={{fontSize: 11, fontWeight: 700, color: C.pinkDark}}>
              🐾 {user.nickname} 님의 스터디룸
            </div>
            <button onClick={handleLogout} style={{background: 'none', border: 'none', fontSize: 11, color: C.muted, cursor: 'pointer', opacity: 0.8}}>
              로그아웃 🚪
            </button>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{fontSize: 36}}>🐈‍⬛</span>
            <div>
              <div style={{fontSize: 10, color: C.pinkDark, letterSpacing: 2, fontWeight: 600}}>STUDY PLANNER</div>
              <div style={{fontSize: 22, fontWeight: 800, background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Todi</div>
            </div>
            <div style={{marginLeft: 'auto', textAlign: 'right'}}>
              <div style={{fontSize: 11, color: C.muted}}>{new Date().toLocaleDateString('ko-KR', {month: 'long', day: 'numeric', weekday: 'short'})}</div>
              <div style={{fontSize: 16, fontWeight: 700, color: C.pinkDark}}>{rate}% 완료 🎀</div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div style={{padding: 16, paddingBottom: 150}}>

          {tab === 'home' && <>
            <div style={{background: 'linear-gradient(135deg, #FFD6E7, #E8D5FF)', borderRadius: 20, padding: 20, marginBottom: 16, color: C.pinkDark}}>
              <div style={{fontSize: 13, opacity: 0.8, marginBottom: 8}}>오늘의 진행률</div>
              <div style={{fontSize: 36, fontWeight: 800, marginBottom: 10, color: C.pinkDark}}>{rate}%</div>
              <div style={{height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 4}}>
                <div style={{width: `${rate}%`, height: '100%', background: `linear-gradient(90deg, ${C.pinkDark}, ${C.lavender})`, borderRadius: 4, transition: 'width 0.5s'}}/>
              </div>
              <div style={{fontSize: 12, opacity: 0.8, marginTop: 6}}>{completed.length}/{todayTodos.length} 완료</div>
            </div>

            <div style={{fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600}}>오늘 할 일</div>
            {todayTodos.filter(t => !t.completed).map(todo => (
                <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo}/>
            ))}
            {todayTodos.filter(t => !t.completed).length === 0 && (
                <div style={{textAlign: 'center', padding: 30, color: C.muted}}>
                  <div style={{fontSize: 36, marginBottom: 8}}>✨</div>
                  <div>오늘 할 일이 없어요!</div>
                </div>
            )}
            {completed.length > 0 && <>
              <div style={{fontSize: 12, color: C.muted, margin: '16px 0 8px', fontWeight: 600}}>완료 🎉</div>
              {todayTodos.filter(t => t.completed).map(todo => (
                  <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo}/>
              ))}
            </>}
          </>}

          {tab === 'calendar' && <>
            <CalendarView selectedDate={selectedDate} onSelect={setSelectedDate} todos={todos}/>
            <div style={{fontSize: 12, color: C.muted, margin: '12px 0 8px', fontWeight: 600}}>
              {selectedDate === todayStr ? '오늘' : selectedDate} 할 일
            </div>
            {selectedTodos.length === 0 && (
                <div style={{textAlign: 'center', padding: 20, color: C.muted}}>
                  <div style={{fontSize: 28, marginBottom: 6}}>🗓</div>
                  <div>이 날은 할 일이 없어요</div>
                </div>
            )}
            {selectedTodos.map(todo => (
                <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo}/>
            ))}
          </>}

          {tab === 'timer' && <TimerTab/>}
          {tab === 'memo' && <MemoTab/>}
        </div>

        {/* 입력 폼 */}
        {showForm && (
            <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 40px', boxShadow: `0 -4px 30px rgba(255,143,171,0.2)`, zIndex: 100, boxSizing: 'border-box'}}>
              <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
              <div style={{fontSize: 15, fontWeight: 700, color: C.pink, marginBottom: 14}}>🐾 새로운 할 일</div>
              <input placeholder="할 일 제목 *" value={form.title}
                     onChange={e => setForm({...form, title: e.target.value})} style={inp}/>
              <input placeholder="메모 (선택)" value={form.memo}
                     onChange={e => setForm({...form, memo: e.target.value})} style={inp}/>
              <input placeholder="카테고리 (예: 수학, 영어)" value={form.category}
                     onChange={e => setForm({...form, category: e.target.value})} style={inp}/>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                      style={{...inp, color: C.text}}>
                <option value="HIGH">🔴 높음</option>
                <option value="MEDIUM">🟡 보통</option>
                <option value="LOW">🟢 낮음</option>
              </select>
              <input type="date" value={form.dueDate}
                     onChange={e => setForm({...form, dueDate: e.target.value})}
                     style={{...inp, width: '100%', WebkitAppearance: 'none', appearance: 'none', display: 'block'}}/>
              <div style={{display: 'flex', gap: 8, marginTop: 4}}>
                <button onClick={() => setShowForm(false)} style={{flex: 1, padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, cursor: 'pointer', color: C.muted}}>취소</button>
                <button onClick={addTodo} style={{flex: 2, padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer'}}>추가 ✨</button>
              </div>
            </div>
        )}

        {/* 하단 탭바 */}
        {!showForm && (
            <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: C.white, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', paddingTop: '6px', zIndex: 50, boxShadow: '0 -2px 10px rgba(255,143,171,0.08)'}}>
              <button onClick={() => setTab('home')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'home' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer'}}>
                <div style={{fontSize: 22}}>🏠</div>
                <div style={{fontWeight: tab === 'home' ? 700 : 400, marginTop: 2}}>홈</div>
              </button>
              <button onClick={() => setTab('calendar')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'calendar' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer'}}>
                <div style={{fontSize: 22}}>📅</div>
                <div style={{fontWeight: tab === 'calendar' ? 700 : 400, marginTop: 2}}>캘린더</div>
              </button>

              {/* 중앙 플러스 추가 버튼 */}
              <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    width: 46, height: 46, borderRadius: 23,
                    background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`,
                    color: 'white', fontSize: 26, fontWeight: 700, border: 'none',
                    cursor: 'pointer', boxShadow: `0 4px 14px rgba(255,92,138,0.4)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'translateY(-6px)', transition: 'all 0.15s ease'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'translateY(-3px) scale(0.95)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'translateY(-6px) scale(1)'}
                >
                  +
                </button>
              </div>

              <button onClick={() => setTab('timer')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'timer' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer'}}>
                <div style={{fontSize: 22}}>⏱</div>
                <div style={{fontWeight: tab === 'timer' ? 700 : 400, marginTop: 2}}>타이머</div>
              </button>
              <button onClick={() => setTab('memo')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'memo' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer'}}>
                <div style={{fontSize: 22}}>📝</div>
                <div style={{fontWeight: tab === 'memo' ? 700 : 400, marginTop: 2}}>메모</div>
              </button>
            </div>
        )}
      </div>
  );
}

function TodoCard({ todo, onToggle, onDelete, compact }) {
  return (
      <div style={{background: compact ? 'transparent' : C.card, borderRadius: compact ? 0 : 14, padding: compact ? '8px 0' : 14, marginBottom: compact ? 0 : 10, display: 'flex', alignItems: 'center', gap: 10, borderBottom: compact ? `1px solid ${C.border}` : 'none', border: compact ? 'none' : `1px solid ${C.border}`}}>
        <button onClick={() => onToggle(todo.id)} style={{width: 26, height: 26, borderRadius: 13, border: `2px solid ${PRIORITY_COLOR[todo.priority] || C.pink}`, background: todo.completed ? PRIORITY_COLOR[todo.priority] : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0}}>
          {todo.completed && <span style={{color: 'white', fontSize: 13}}>✓</span>}
        </button>
        <div style={{flex: 1}}>
          <div style={{fontSize: 14, fontWeight: 500, color: todo.completed ? C.muted : C.text, textDecoration: todo.completed ? 'line-through' : 'none'}}>{todo.title}</div>
          {todo.memo && <div style={{fontSize: 11, color: C.muted, marginTop: 2}}>{todo.memo}</div>}
          <div style={{display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap'}}>
            {todo.category && <span style={{fontSize: 10, color: C.pinkDark, background: '#FFE4F0', padding: '1px 7px', borderRadius: 8}}>{todo.category}</span>}
          </div>
        </div>
        <button onClick={() => onDelete(todo.id)} style={{background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', opacity: 0.5}}>🗑</button>
      </div>
  );
}

function MemoTab() {
  const [memos, setMemos] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const fileInputRef = useRef(null);

  const fetchMemos = async () => {
    try {
      const res = await axios.get(`${API}/memos`);
      setMemos(res.data);
    } catch (err) {
      console.error('Failed to fetch memos:', err);
    }
  };

  const fetchImages = async (memoId) => {
    try {
      const res = await axios.get(`${API}/memos/${memoId}/images`);
      setImages(res.data);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    }
  };

  useEffect(() => { fetchMemos(); }, []);

  const openNew = () => {
    setSelectedMemo(null);
    setTitle('');
    setContent('');
    setImages([]);
    setShowEditor(true);
  };

  const openEdit = async (memo) => {
    setSelectedMemo(memo);
    setTitle(memo.title);
    setContent(memo.content || '');
    setShowEditor(true);
    await fetchImages(memo.id);
  };

  const save = async () => {
    if (!title.trim()) return;
    try {
      if (selectedMemo) {
        await axios.put(`${API}/memos/${selectedMemo.id}`, { title, content });
      } else {
        await axios.post(`${API}/memos`, { title, content });
      }
      setShowEditor(false);
      fetchMemos();
    } catch (err) {
      console.error('Failed to save memo:', err);
    }
  };

  const deleteMemo = async (id) => {
    try {
      await axios.delete(`${API}/memos/${id}`);
      fetchMemos();
    } catch (err) {
      console.error('Failed to delete memo:', err);
    }
  };

  const getImageUrl = (img) => {
    if (!img) return '';
    const url = img.url || img.fallbackUrl || '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = API.replace('/api', '');
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    return `${baseUrl}/${url}`;
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const tempImage = { id: 'temp_' + Date.now(), url: dataUrl, fallbackUrl: dataUrl, isLocal: true, originalName: file.name };

      setImages(prev => [...prev, tempImage]);

      try {
        let memoId;

        if (!selectedMemo) {
          const currentTitle = title.trim() || '새 메모';
          if (!title.trim()) setTitle(currentTitle);
          const res = await axios.post(`${API}/memos`, { title: currentTitle, content });
          memoId = res.data.id;
          setSelectedMemo(res.data);
        } else {
          memoId = selectedMemo.id;
        }

        const formData = new FormData();
        formData.append('file', file);

        await axios.post(`${API}/memos/${memoId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        try {
          const imgRes = await axios.get(`${API}/memos/${memoId}/images`);
          if (imgRes.data && imgRes.data.length > 0) {
            setImages(imgRes.data.map(serverImg => ({
              ...serverImg,
              fallbackUrl: dataUrl
            })));
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch server images, retaining local DataURL:', fetchErr);
        }
      } catch (err) {
        console.warn('서버 전송 중 오류가 발생했지만, 화면에는 로컬 이미지로 표시됩니다:', err);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteImage = async (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    try {
      if (typeof imageId === 'number' || (!String(imageId).startsWith('temp_'))) {
        await axios.delete(`${API}/memos/images/${imageId}`);
        if (selectedMemo) await fetchImages(selectedMemo.id);
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const filtered = memos.filter(m =>
      m.title.includes(search) || (m.content || '').includes(search)
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
  };

  const closeLightbox = () => {
    setPreviewUrl(null);
    setZoomScale(1);
  };

  if (showEditor) {
    return (
        <div style={{paddingTop: 8}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <button onClick={() => setShowEditor(false)} style={{background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer'}}>← 뒤로</button>
            <button onClick={save} style={{padding: '8px 20px', borderRadius: 20, border: 'none', background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer'}}>저장 ✨</button>
          </div>

          <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)}
                 style={{width: '100%', fontSize: 18, fontWeight: 700, border: 'none', background: 'transparent', padding: '8px 0', marginBottom: 8, borderBottom: `1px solid ${C.border}`, outline: 'none', color: C.text, boxSizing: 'border-box'}}/>

          <textarea placeholder="내용을 입력하세요 ✍️" value={content} onChange={e => setContent(e.target.value)}
                    style={{width: '100%', minHeight: 200, padding: 0, border: 'none', background: 'transparent', fontSize: 15, color: C.text, outline: 'none', resize: 'none', lineHeight: 1.8, fontFamily: '-apple-system, sans-serif'}}/>

          {/* 이미지 업로드 버튼 */}
          <button onClick={() => fileInputRef.current.click()} style={{display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: `1.5px dashed ${C.border}`, background: 'transparent', color: C.pink, fontSize: 13, cursor: 'pointer', marginTop: 12, marginBottom: 16}}>
            📷 사진 추가
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{display: 'none'}} onChange={uploadImage}/>

          {/* 이미지 목록 */}
          {images.length > 0 && (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16}}>
                {images.map(img => {
                  const src = getImageUrl(img);
                  return (
                    <div 
                      key={img.id} 
                      onClick={(e) => { 
                        const activeSrc = e.currentTarget.querySelector('img')?.src || src;
                        setPreviewUrl({ url: activeSrc, fallbackUrl: img.fallbackUrl }); 
                        setZoomScale(1); 
                      }}
                      style={{position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', cursor: 'pointer'}}
                    >
                      <img src={src} alt={img.originalName || '사진'}
                           onError={(e) => {
                             if (img.fallbackUrl && e.currentTarget.src !== img.fallbackUrl) {
                               e.currentTarget.src = img.fallbackUrl;
                             }
                           }}
                           style={{width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease'}}
                           onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                           onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}/>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} 
                        style={{position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 10, color: 'white', fontSize: 11, cursor: 'pointer', padding: '2px 6px'}}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
          )}

          {/* 이미지 확대 라이트박스 모달 */}
          {previewUrl && (
            <div 
              onClick={closeLightbox} 
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 20
              }}
            >
              <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  onClick={closeLightbox} 
                  style={{
                    position: 'absolute', top: -48, right: 0,
                    background: 'rgba(255, 255, 255, 0.25)', border: 'none',
                    borderRadius: 18, color: 'white', width: 36, height: 36,
                    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  ✕
                </button>
                <img 
                  src={typeof previewUrl === 'object' ? previewUrl.url : previewUrl} 
                  alt="확대 이미지"
                  onError={(e) => {
                    if (typeof previewUrl === 'object' && previewUrl.fallbackUrl && e.currentTarget.src !== previewUrl.fallbackUrl) {
                      e.currentTarget.src = previewUrl.fallbackUrl;
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomScale(prev => prev === 1 ? 1.5 : 1);
                  }}
                  style={{
                    maxHeight: '80vh', maxWidth: '90vw', borderRadius: 16,
                    objectFit: 'contain',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    transform: `scale(${zoomScale})`,
                    transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    cursor: zoomScale === 1 ? 'zoom-in' : 'zoom-out'
                  }}
                />
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 14, fontWeight: 500 }}>
                  🔍 이미지를 클릭하면 확대/축소됩니다 • 바깥을 누르면 닫힙니다
                </div>
              </div>
            </div>
          )}
        </div>
    );
  }

  return (
      <div style={{paddingTop: 8}}>
        <input placeholder="🔍 메모 검색" value={search} onChange={e => setSearch(e.target.value)}
               style={{...inp, marginBottom: 12}}/>
        <button onClick={openNew} style={{width: '100%', padding: 14, borderRadius: 14, border: `2px dashed ${C.border}`, background: 'transparent', color: C.pink, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16}}>
          + 새 메모 작성
        </button>
        {filtered.length === 0 && (
            <div style={{textAlign: 'center', padding: 30, color: C.muted}}>
              <div style={{fontSize: 36, marginBottom: 8}}>📝</div>
              <div>메모가 없어요!</div>
            </div>
        )}
        {filtered.map(memo => (
            <div key={memo.id} onClick={() => openEdit(memo)} style={{background: C.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, cursor: 'pointer', position: 'relative'}}>
              <div style={{fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6}}>{memo.title}</div>
              {memo.content && <div style={{fontSize: 13, color: C.muted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{memo.content}</div>}
              <div style={{fontSize: 11, color: C.muted, marginTop: 8}}>{formatDate(memo.updatedAt)}</div>
              <button onClick={e => { e.stopPropagation(); deleteMemo(memo.id); }}
                      style={{position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', opacity: 0.5}}>🗑</button>
            </div>
        ))}
      </div>
  );
}

function CalendarView({ selectedDate, onSelect, todos }) {
  const [current, setCurrent] = useState(new Date());
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const hasTodo = (day) => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return todos.some(t => t.dueDate === d);
  };

  const selectDay = (day) => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    onSelect(d);
  };

  return (
      <div style={{background: C.card, borderRadius: 20, padding: 16, marginBottom: 8, border: `1px solid ${C.border}`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <button onClick={() => setCurrent(new Date(year, month-1))} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted}}>‹</button>
          <div style={{fontSize: 15, fontWeight: 700, color: C.text}}>{year}년 {month+1}월</div>
          <button onClick={() => setCurrent(new Date(year, month+1))} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted}}>›</button>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center'}}>
          {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} style={{fontSize: 10, color: C.muted, padding: '4px 0'}}>{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasT = hasTodo(day);
            return (
                <button key={day} onClick={() => selectDay(day)} style={{
                  padding: '6px 0', borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                  background: isSelected ? `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})` : isToday ? '#FFE4F0' : 'transparent',
                  color: isSelected ? 'white' : isToday ? C.pinkDark : C.text,
                  fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400
                }}>
                  {day}
                  {hasT && <div style={{position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: isSelected ? 'white' : C.pink}}/>}
                </button>
            );
          })}
        </div>
      </div>
  );
}

function TimerTab() {
  const [subject, setSubject] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState('focus');
  const [timerId, setTimerId] = useState(null);
  const [records, setRecords] = useState([]);
  const intervalRef = useRef(null);

  const start = async () => {
    if (!subject.trim()) return;
    try {
      const res = await axios.post(`${API}/timer/start`, { subject });
      setTimerId(res.data.id);
      setRunning(true);
      setSeconds(0);
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start timer:', err);
    }
  };

  const stop = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    const endTime = new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
    const duration = seconds;
    try {
      if (timerId) await axios.patch(`${API}/timer/${timerId}/stop`);
    } catch (err) {
      console.error('Failed to stop timer:', err);
    }
    setRecords(prev => [{subject, duration, endTime, mode}, ...prev]);
    setSeconds(0);
    setTimerId(null);
  };

  const switchMode = (m) => {
    if (running) return;
    setMode(m);
    setSeconds(0);
  };

  const deleteRecord = (i) => {
    setRecords(prev => prev.filter((_, idx) => idx !== i));
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const hh = Math.floor(seconds / 3600);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}시간 ${m % 60}분`;
    if (m > 0) return `${m}분 ${s % 60}초`;
    return `${s}초`;
  };

  return (
      <div style={{paddingTop: 16}}>
        <div style={{display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24}}>
          {[['focus','🎯 집중'], ['break','☕ 휴식']].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{padding: '8px 20px', borderRadius: 20, border: 'none', background: mode === m ? `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})` : C.border, color: mode === m ? 'white' : C.muted, fontWeight: mode === m ? 700 : 400, cursor: running ? 'not-allowed' : 'pointer', opacity: running && mode !== m ? 0.4 : 1}}>
                {label}
              </button>
          ))}
        </div>

        <div style={{textAlign: 'center', background: C.card, borderRadius: 24, padding: '32px 20px', marginBottom: 16, border: `1px solid ${C.border}`}}>
          <div style={{fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 2}}>{mode === 'focus' ? '집중 시간' : '휴식 시간'}</div>
          <div style={{fontSize: 56, fontWeight: 800, letterSpacing: 4, background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8}}>
            {hh > 0 && `${String(hh).padStart(2,'0')}:`}{mm}:{ss}
          </div>
          {subject && <div style={{fontSize: 13, color: C.muted}}>📖 {subject}</div>}
        </div>

        <input placeholder="무슨 과목 공부할까요? 🐱" value={subject} onChange={e => setSubject(e.target.value)}
               disabled={running} style={{...inp, opacity: running ? 0.5 : 1}}/>

        <button onClick={running ? stop : start} style={{width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: running ? '#FF5252' : `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px rgba(255,92,138,0.3)`, marginBottom: 20}}>
          {running ? '⏹ 공부 종료' : '▶ 공부 시작'}
        </button>

        {records.length > 0 && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <div style={{fontSize: 12, color: C.muted, fontWeight: 600}}>오늘 공부 기록 📝</div>
                <button onClick={() => setRecords([])} style={{background: 'none', border: 'none', fontSize: 11, color: C.muted, cursor: 'pointer'}}>전체 삭제</button>
              </div>
              {records.map((r, i) => (
                  <div key={i} style={{background: C.card, borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontSize: 13, fontWeight: 600, color: C.text}}>{r.mode === 'focus' ? '🎯' : '☕'} {r.subject}</div>
                      <div style={{fontSize: 11, color: C.muted, marginTop: 2}}>{formatDuration(r.duration)}</div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <div style={{fontSize: 11, color: C.muted}}>{r.endTime} 종료</div>
                      <button onClick={() => deleteRecord(i)} style={{background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', opacity: 0.5}}>🗑</button>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

const inp = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: `1px solid #FFE4F0`, background: '#FFF5F7',
  color: '#333344', fontSize: 16, outline: 'none',
  boxSizing: 'border-box', marginBottom: 10,
  WebkitAppearance: 'none', appearance: 'none', display: 'block'
};

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !password.trim()) {
      setError('닉네임과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    const cleanNick = nickname.trim();

    try {
      try {
        const endpoint = mode === 'login' ? `${API}/auth/login` : `${API}/auth/signup`;
        const res = await axios.post(endpoint, { nickname: cleanNick, password });
        if (res.data && res.data.nickname) {
          onLogin(res.data);
          return;
        }
      } catch (backendErr) {
        // 백엔드 미구동 시 로컬 인증
      }

      const storedUsers = JSON.parse(localStorage.getItem('todi_registered_users') || '[]');

      if (mode === 'signup') {
        const existing = storedUsers.find(u => u.nickname === cleanNick);
        if (existing) {
          setError('이미 등록된 닉네임입니다.');
          return;
        }
        const newUser = { id: Date.now(), nickname: cleanNick, password };
        localStorage.setItem('todi_registered_users', JSON.stringify([...storedUsers, newUser]));
        onLogin(newUser);
      } else {
        const found = storedUsers.find(u => u.nickname === cleanNick && u.password === password);
        if (!found) {
          setError('닉네임 또는 비밀번호가 올바르지 않습니다.');
          return;
        }
        onLogin(found);
      }
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(160deg, #FFF0F5 0%, #F0E4FF 100%)', 
      minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, boxSizing: 'border-box', fontFamily: '-apple-system, sans-serif'
    }}>
      <div style={{ 
        background: C.card, borderRadius: 28, padding: '36px 24px', width: '100%', 
        boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(255,143,171,0.2)', 
        border: `1px solid ${C.border}`, textAlign: 'center' 
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🐈‍⬛</div>
        <div style={{ fontSize: 10, color: C.pinkDark, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>PRIVATE STUDY PLANNER</div>
        <div style={{ fontSize: 26, fontWeight: 800, background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>Todi</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>소수 지인 전용 비밀 공간 🐾</div>

        <div style={{ display: 'flex', background: '#FFF0F5', borderRadius: 14, padding: 4, marginBottom: 20 }}>
          <button 
            type="button"
            onClick={() => { setMode('login'); setError(''); }} 
            style={{ 
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, 
              background: mode === 'login' ? 'white' : 'transparent', 
              color: mode === 'login' ? C.pinkDark : C.muted, 
              fontWeight: mode === 'login' ? 700 : 400, cursor: 'pointer', fontSize: 14, 
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' 
            }}>
            로그인
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); setError(''); }} 
            style={{ 
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, 
              background: mode === 'signup' ? 'white' : 'transparent', 
              color: mode === 'signup' ? C.pinkDark : C.muted, 
              fontWeight: mode === 'signup' ? 700 : 400, cursor: 'pointer', fontSize: 14, 
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' 
            }}>
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input 
            placeholder="닉네임 (예: 홍길동)" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)}
            style={{ ...inp, marginBottom: 12 }} 
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{ ...inp, marginBottom: 16 }} 
          />

          {error && <div style={{ color: '#FF5252', fontSize: 12, marginBottom: 14, fontWeight: 500 }}>⚠️ {error}</div>}

          <button 
            type="submit" 
            style={{ 
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', 
              background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, 
              color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', 
              boxShadow: '0 4px 16px rgba(255,92,138,0.3)' 
            }}>
            {mode === 'login' ? '로그인하기 ✨' : '가입하고 시작하기 ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}