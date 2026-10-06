import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'https://todi-production-6cad.up.railway.app/api';

// 서버에서 내려준 로그인 응답(authData: {nickname, email, statusMessage, avatarEmoji, avatarSize, hasPhoto, ...})을
// 기존 로컬 유저 정보(cached)에 덮어씀. 이제 상태메시지/아바타도 서버가 기준(정답)이라서,
// 다른 기기에서 로그인해도 이걸로 항상 최신 정보가 그대로 뜸.
// hasPhoto는 서버가 계산해서 알려주는 값이라, avatarType은 여기서 photo/emoji로 바로 정해줌
// (avatarPhotoVersion은 이미지 캐시 무효화용이라 서버엔 없는 값이라 그대로 유지)
const applyServerProfile = (cached, authData) => {
  const base = cached || {};
  return {
    ...base,
    nickname: authData.nickname,
    email: authData.email,
    statusMessage: authData.statusMessage ?? '',
    avatarEmoji: authData.avatarEmoji || base.avatarEmoji,
    avatarSize: authData.avatarSize || base.avatarSize || 'medium',
    avatarType: authData.avatarType || (authData.hasPhoto ? 'photo' : 'emoji'),
    hasPhoto: !!authData.hasPhoto,
    provider: authData.provider || base.provider,
  };
};


// 로그인한 사용자의 닉네임 (없으면 빈 문자열). <img src>에 ?nickname= 쿼리로 붙일 때만 사용
const getNickname = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('todi_user'));
    return saved && saved.nickname ? saved.nickname : '';
  } catch (e) {
    return '';
  }
};

const getToken = () => localStorage.getItem('todi_token') || '';

// 모든 API 요청에 로그인 토큰을 자동으로 붙임. 서버가 토큰을 검증해서 진짜 주인이 누군지 판단하므로
// (예전처럼 닉네임을 그냥 헤더에 적어서 보내는 방식은 아무나 남의 닉네임을 흉내낼 수 있어서 위험했음)
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

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

// 카테고리 기본 색상 팔레트 (새 카테고리 만들 때 고르는 색)
const CATEGORY_COLORS = ['#FF8FAB', '#C9A7FF', '#7FB5FF', '#7ED6B0', '#FFD93D', '#FFA96B'];

// 심플한 라인(아웃라인) 아이콘 세트. 이모지 대신 통일된 톤의 SVG 아이콘으로 사용
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8 }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', display: 'block' };
  switch (name) {
    case 'home':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/></svg>);
    case 'calendar':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>);
    case 'timer':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>);
    case 'note':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M8 12h8M8 16h5"/></svg>);
    case 'settings':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(4.56 4.56) scale(0.62)">
          <circle cx="12" cy="12" r="5.3" fill="none" stroke={color} strokeWidth={strokeWidth / 0.62}/>
          <rect x="10.2" y="1" width="3.6" height="6" rx="1.8" fill={color} stroke="none"/>
          <rect x="10.2" y="1" width="3.6" height="6" rx="1.8" fill={color} stroke="none" transform="rotate(60 12 12)"/>
          <rect x="10.2" y="1" width="3.6" height="6" rx="1.8" fill={color} stroke="none" transform="rotate(120 12 12)"/>
          <rect x="10.2" y="1" width="3.6" height="6" rx="1.8" fill={color} stroke="none" transform="rotate(180 12 12)"/>
          <rect x="10.2" y="1" width="3.6" height="6" rx="1.8" fill={color} stroke="none" transform="rotate(240 12 12)"/>
          <rect x="10.2" y="1" width="3.6" height="6" rx="1.8" fill={color} stroke="none" transform="rotate(300 12 12)"/>
        </g>
        <g transform="translate(15.6 0.3) scale(0.52)" fill="none" stroke={color} strokeWidth={strokeWidth / 0.52} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 15C8 15 2 10.5 2 6.5C2 4 4 2.5 6.2 2.5C7.4 2.5 8 3.6 8 3.6C8 3.6 8.6 2.5 9.8 2.5C12 2.5 14 4 14 6.5C14 10.5 8 15 8 15Z"/>
        </g>
      </svg>);
    case 'repeat':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 12V9a3 3 0 0 1 3-3h14"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12v3a3 3 0 0 1-3 3h-14"/></svg>);
    case 'palette':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 2-2 1.7 1.7 0 0 0-.5-1.2 1.7 1.7 0 0 1-.5-1.2 1.8 1.8 0 0 1 1.8-1.8H18a3 3 0 0 0 3-3 9.1 9.1 0 0 0-9-8.8Z"/><circle cx="7.5" cy="12" r="1.1" fill={color} stroke="none"/><circle cx="9" cy="8" r="1.1" fill={color} stroke="none"/><circle cx="14" cy="7.5" r="1.1" fill={color} stroke="none"/><circle cx="16.5" cy="11" r="1.1" fill={color} stroke="none"/></svg>);
    case 'trash':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9.5 7V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M18.5 7l-.8 12.5a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9L5.5 7"/><path d="M10 11v6M14 11v6"/></svg>);
    case 'camera':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"/><circle cx="12" cy="13" r="3.3"/></svg>);
    case 'search':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>);
    case 'logout':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>);
    case 'edit':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 5.5 18.5 11.5 8 22H2v-6Z"/><path d="m15.5 2.5 6 6"/></svg>);
    case 'alert':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>);
    case 'award':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.6 2.6L16.2 9"/></svg>);
    case 'paw':
      return (<svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><ellipse cx="12" cy="16.3" rx="5.2" ry="4.2"/><circle cx="5.3" cy="9.6" r="2.1"/><circle cx="9.8" cy="5.6" r="2.1"/><circle cx="14.2" cy="5.6" r="2.1"/><circle cx="18.7" cy="9.6" r="2.1"/></svg>);
    case 'target':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill={color} stroke="none"/></svg>);
    case 'coffee':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h13v6a4.5 4.5 0 0 1-4.5 4.5h-4A4.5 4.5 0 0 1 4 15V9Z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c-.5 1 .5 1.3 0 2.5M12 3c-.5 1 .5 1.3 0 2.5"/></svg>);
    case 'book':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5v-17Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2.5v-17Z"/></svg>);
    case 'chart':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>);
    case 'play':
      return (<svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>);
    case 'mail':
      return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>);
    default:
      return null;
  }
}

// 기기의 로컬 날짜를 "YYYY-MM-DD" 문자열로 변환 (UTC 변환 없이, 자정~오전 시간대 오차 방지)
const getLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// "YYYY-MM-DD" 문자열을 "9월 27일 (일)" 형태로 변환 (직접 분해해서 타임존 오차 방지)
const formatDateLabel = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
};

// "YYYY-MM-DD" -> "9월 27일" (짧은 형태, 목록 제목용)
const formatDateShort = (dateStr) => {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}월 ${d}일`;
};

// 기간 표시용 짧은 포맷 (9/28)
const formatDateMD = (dateStr) => {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}/${d}`;
};

// 서버 에러 응답에서 사용자에게 보여줄 메시지 꺼내기 (409 중복, 400 형식 오류 등)
const errorMessage = (err) => {
  const data = err.response?.data;
  if (data && typeof data === 'object') {
    return data.message || Object.values(data)[0] || '요청에 실패했어요.';
  }
  return '요청에 실패했어요.';
};

const defaultForm = {
  title: '', memo: '', categoryId: '', priority: 'MEDIUM',
  dueDate: getLocalDateStr(), endDate: '',
  isRoutine: false, subject: '', studyType: 'ETC', estimatedTime: 0
};

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('todi_user');
      return saved && localStorage.getItem('todi_token') ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  // 저장된 토큰이 아직 유효한지 서버에 확인하는 동안(true) 앱 화면 대신 로딩만 보여줌
  const [checkingSession, setCheckingSession] = useState(() => !!localStorage.getItem('todi_token'));

  const [tab, setTab] = useState('home');
  const [todos, setTodos] = useState([]);
  const [routineCompletions, setRoutineCompletions] = useState([]);  // [{todoId, date}] - 루틴 할 일의 날짜별 완료 기록
  const [routineExclusions, setRoutineExclusions] = useState([]);  // [{todoId, date}] - 루틴 할 일을 "그 날짜만" 삭제한 기록
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);   // null이면 새 할 일 추가, 값 있으면 그 id를 수정 중
  const [form, setForm] = useState(defaultForm);
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [groups, setGroups] = useState([]);                // 카테고리별로 묶인 오늘 할 일
  const [showCatManager, setShowCatManager] = useState(false);
  const [showRoutines, setShowRoutines] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [deleteChoice, setDeleteChoice] = useState(null);  // 루틴 할 일 삭제 시 {id, title} - "이 날짜만" vs "전체" 선택 모달
  const [editingTodo, setEditingTodo] = useState(null);    // 지금 수정 중인 할 일의 원본(서버에서 받은 그대로) - 루틴인지 판단용
  const [editChoice, setEditChoice] = useState(null);       // 루틴 할 일 수정 시 {id, title, body, date} - "이 날짜만" vs "전체" 선택 모달
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showCategoryFilterMenu, setShowCategoryFilterMenu] = useState(false);
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState('ALL');
  const [showCalendarCategoryFilterMenu, setShowCalendarCategoryFilterMenu] = useState(false);
  const prevRateRef = useRef({});
  const categories = groups.filter(g => g.id !== null);    // "미분류"(id null)를 뺀 실제 카테고리

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API}/todos`);
      setTodos(res.data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    }
  };

  const fetchRoutineCompletions = async () => {
    try {
      const res = await axios.get(`${API}/todos/routine-completions`);
      setRoutineCompletions(res.data);
    } catch (err) {
      console.error('Failed to fetch routine completions:', err);
    }
  };

  // 루틴 할 일 하나가 특정 날짜에 완료됐는지
  const isRoutineDoneOn = (todoId, date) =>
      routineCompletions.some(c => c.todoId === todoId && c.date === date);

  const fetchRoutineExclusions = async () => {
    try {
      const res = await axios.get(`${API}/todos/routine-exclusions`);
      setRoutineExclusions(res.data);
    } catch (err) {
      console.error('Failed to fetch routine exclusions:', err);
    }
  };

  // 루틴 할 일 하나가 특정 날짜에 "그 날짜만 삭제"로 제외됐는지
  const isRoutineExcludedOn = (todoId, date) =>
      routineExclusions.some(e => e.todoId === todoId && e.date === date);

  const fetchGroups = async (date) => {
    try {
      const res = await axios.get(`${API}/categories/grouped`, { params: { date } });
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const refresh = () => {
    fetchTodos();
    fetchGroups(selectedDate);
    fetchRoutineCompletions();
    fetchRoutineExclusions();
  };

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  // 앱을 새로 열었을 때, 저장해둔 로그인 토큰이 아직 유효한지 서버에서 확인
  // (토큰이 만료됐거나 조작된 값이면 서버가 거부하므로 다시 로그인 화면으로 보냄)
  useEffect(() => {
    const token = localStorage.getItem('todi_token');
    if (!token) { setCheckingSession(false); return; }

    axios.get(`${API}/auth/me`).then(res => {
      setUser(prev => {
        const merged = applyServerProfile(prev, res.data);
        localStorage.setItem('todi_user', JSON.stringify(merged));
        return merged;
      });
    }).catch((err) => {
      // 진짜 로그인이 무효할 때(401/403)만 로그아웃시킴.
      // 네트워크가 잠깐 끊기거나 서버가 응답이 느릴 때(예: 무료 플랜 서버 깨어나는 중)까지 로그아웃되면
      // "새로고침했더니 로그인 화면으로 돌아온다"는 버그가 생겨서, 그런 경우엔 그냥 저장해둔 정보로 계속 진행함
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('todi_token');
        localStorage.removeItem('todi_user');
        setUser(null);
      }
    }).finally(() => setCheckingSession(false));
  }, []);

  // 로그인/회원가입/구글 로그인 성공 시 공통으로 호출됨 (AuthScreen에서 {token, email, nickname}을 넘겨줌)
  const handleLogin = (authData) => {
    localStorage.setItem('todi_token', authData.token);
    let cached = null;
    try {
      const saved = JSON.parse(localStorage.getItem('todi_user'));
      if (saved && saved.nickname === authData.nickname) cached = saved;
    } catch (e) { /* 무시 */ }
    const merged = applyServerProfile(cached, authData);
    setUser(merged);
    localStorage.setItem('todi_user', JSON.stringify(merged));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('todi_user');
    localStorage.removeItem('todi_token');
  };

  // 설정 탭에서 "저장" 한 번 눌렀을 때 (닉네임/상태메시지/아바타 이모지·크기·타입 전부 한 번에) 반영.
  // newToken: 닉네임이 바뀐 경우에만 있음 - 서버가 새 닉네임으로 다시 발급해준 로그인 토큰.
  // 기존 토큰에는 옛 닉네임이 그대로 박혀 있어서, 이걸로 안 바꾸면 다음 요청부터 서버가 옛 닉네임으로
  // 인증해버려 방금 옮겨놓은 데이터가 안 보이게 됨
  const handleProfileSaved = (fields) => {
    const { token: newToken, ...rest } = fields;
    if (newToken) localStorage.setItem('todi_token', newToken);
    const nicknameChanged = rest.nickname && rest.nickname !== user.nickname;
    const updated = { ...user, ...rest };
    setUser(updated);
    localStorage.setItem('todi_user', JSON.stringify(updated));
    if (nicknameChanged) setTimeout(refresh, 0);
  };

  // 회원 탈퇴 완료 후: 로그인 정보를 전부 지우고 로그인 화면으로
  const handleWithdrawn = () => {
    setUser(null);
    localStorage.removeItem('todi_user');
    localStorage.removeItem('todi_token');
  };

  const todayStr = getLocalDateStr();
  const isToday = selectedDate === todayStr;
  // 선택한 날짜의 할 일: 그 날짜에 정확히 등록된 할 일 + 시작일이 지난 루틴 할 일(완료 여부는 그 날짜 기준)
  const selectedTodos = [
    ...todos.filter(t => !t.isRoutine && !t.endDate && t.dueDate === selectedDate),
    ...todos.filter(t => !t.isRoutine && t.endDate && t.dueDate <= selectedDate && selectedDate <= t.endDate),
    ...todos.filter(t => t.isRoutine && t.dueDate <= selectedDate && !isRoutineExcludedOn(t.id, selectedDate))
        .map(t => ({...t, completed: isRoutineDoneOn(t.id, selectedDate)})),
  ];
  const completed = selectedTodos.filter(t => t.completed);
  const rate = selectedTodos.length === 0 ? 0 : Math.round((completed.length / selectedTodos.length) * 100);

  // 100% 달성 감지는 훅이라 이른 return보다 먼저 호출돼야 함 (Rules of Hooks).
  // 예전엔 여기서 selectedTodos가 아니라 todos를 직접(그것도 dueDate만 보고) 다시 걸러서 계산해서,
  // 루틴 할 일이 있는 날엔 그 루틴이 아예 안 잡히거나 완료 여부가 실제 화면 진행률(rate)이랑 안 맞아서
  // 100%가 떠도 축하 문구가 안 뜨는 버그가 있었음. 이제 진행률 바랑 똑같은 selectedTodos/rate를 그대로 씀
  useEffect(() => {
    const prevRate = prevRateRef.current[selectedDate];
    if (selectedTodos.length > 0 && rate === 100 && prevRate !== 100) {
      setShowCelebration(true);
    }
    prevRateRef.current[selectedDate] = rate;
  }, [rate, selectedDate, selectedTodos.length]);


  if (checkingSession) {
    return (
        <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, color: C.muted, fontSize: 13}}>
          불러오는 중...
        </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // 폼 열기. 카테고리 헤더의 + 버튼으로 열면 그 카테고리가 미리 선택돼
  const openForm = (categoryId) => {
    setEditingId(null);
    setEditingTodo(null);
    setForm({ ...defaultForm, categoryId: categoryId ?? '' });
    setShowForm(true);
  };

  // 기존 할 일 수정 폼 열기 (날짜 잘못 만들었을 때 등, 필드 값 그대로 채워서 열어줌)
  const openEditForm = (todo) => {
    setEditingId(todo.id);
    setEditingTodo(todo);
    setForm({
      title: todo.title,
      memo: todo.memo || '',
      categoryId: todo.categoryId ?? '',
      priority: todo.priority || 'MEDIUM',
      dueDate: todo.dueDate,
      endDate: todo.endDate || '',
      isRoutine: todo.isRoutine,
      subject: todo.subject || '',
      studyType: todo.studyType || 'ETC',
      estimatedTime: todo.estimatedTime || 0,
    });
    setShowForm(true);
  };

  const saveTodo = async () => {
    if (!form.title.trim()) return;
    const body = {
      ...form,
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
      endDate: form.endDate === '' ? null : form.endDate,
      nickname: user.nickname,
    };
    // 루틴 할 일을 수정하는 거면, 곧바로 전체(원본)를 고치지 않고
    // "이 날짜만" vs "전체" 먼저 물어봄 (안 그러면 그 날짜만 바꾸고 싶었는데 전체 반복 일정이 다 바뀌어버림)
    if (editingId && editingTodo && editingTodo.isRoutine) {
      setEditChoice({ id: editingId, title: form.title, body, date: selectedDate });
      return;
    }
    try {
      if (editingId) {
        await axios.put(`${API}/todos/${editingId}`, body);
      } else {
        await axios.post(`${API}/todos`, body);
      }
      setForm(defaultForm);
      setShowForm(false);
      setEditingId(null);
      setEditingTodo(null);
      refresh();
    } catch (err) {
      console.error('Failed to save todo:', err);
    }
  };

  // 루틴 할 일을 "이 날짜만" 수정 (원본 루틴은 그대로, 그 날짜만 일반 할 일로 분리됨)
  const saveEditOccurrence = async () => {
    if (!editChoice) return;
    try {
      await axios.put(`${API}/todos/${editChoice.id}`, editChoice.body, { params: { date: editChoice.date } });
      setForm(defaultForm);
      setShowForm(false);
      setEditingId(null);
      setEditingTodo(null);
      refresh();
    } catch (err) {
      console.error('Failed to save routine occurrence:', err);
    } finally {
      setEditChoice(null);
    }
  };

  // 루틴 할 일을 전체(원본, 모든 날짜) 수정
  const saveEditAll = async () => {
    if (!editChoice) return;
    try {
      await axios.put(`${API}/todos/${editChoice.id}`, editChoice.body);
      setForm(defaultForm);
      setShowForm(false);
      setEditingId(null);
      setEditingTodo(null);
      refresh();
    } catch (err) {
      console.error('Failed to save routine entirely:', err);
    } finally {
      setEditChoice(null);
    }
  };

  const toggleComplete = async (id) => {
    try {
      // date를 같이 보내야 루틴 할 일이 "그 날짜만" 완료 처리됨 (일반 할 일은 서버에서 무시하고 그냥 토글)
      await axios.patch(`${API}/todos/${id}/complete`, null, { params: { date: selectedDate } });
      refresh();
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  // 할 일 삭제. 루틴 할 일이면 바로 안 지우고, "이 날짜만" / "전체" 중 고를 수 있게 선택 모달을 띄움
  const deleteTodo = async (todo) => {
    if (todo && typeof todo === 'object' && todo.isRoutine) {
      setDeleteChoice({ id: todo.id, title: todo.title });
      return;
    }
    const id = (todo && typeof todo === 'object') ? todo.id : todo;
    try {
      await axios.delete(`${API}/todos/${id}`);
      refresh();
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  // 루틴 할 일을 "이 날짜만" 삭제 (다른 날짜엔 그대로 남음)
  const deleteRoutineOccurrence = async () => {
    if (!deleteChoice) return;
    try {
      await axios.delete(`${API}/todos/${deleteChoice.id}`, { params: { date: selectedDate } });
      refresh();
    } catch (err) {
      console.error('Failed to delete routine occurrence:', err);
    } finally {
      setDeleteChoice(null);
    }
  };

  // 루틴 할 일을 전체(모든 날짜) 삭제
  const deleteRoutineAll = async () => {
    if (!deleteChoice) return;
    try {
      await axios.delete(`${API}/todos/${deleteChoice.id}`);
      refresh();
    } catch (err) {
      console.error('Failed to delete routine entirely:', err);
    } finally {
      setDeleteChoice(null);
    }
  };

  // 카테고리 색깔 순서 맵 (홈 화면 카테고리 순서와 동일하게)
  const colorOrderMap = Object.fromEntries(groups.map((g, idx) => [g.id, idx]));

  // 카테고리 필터 적용된 목록 (전체 보기면 그대로, 아니면 선택된 카테고리만)
  const visibleGroups = categoryFilter === 'ALL' ? groups : groups.filter(g => (g.id ?? 'NONE') === categoryFilter);

  // 할 일을 카테고리 색깔 순서로 정렬 (같은 카테고리끼리는 등록 순서 유지)
  const sortByColor = (list) => {
    return [...list].sort((a, b) => {
      const orderA = colorOrderMap[a.categoryId] ?? 999;
      const orderB = colorOrderMap[b.categoryId] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.id - b.id;
    });
  };

  return (
      <div style={{background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', fontFamily: '-apple-system, sans-serif', color: C.text}}>

        {/* 헤더 */}
        <div style={{background: 'linear-gradient(160deg, #FFE8F2 0%, #F0E4FF 100%)', padding: '48px 20px 16px', borderBottom: `1px solid ${C.border}`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2}}>
            <Avatar user={user} size={AVATAR_HEADER_PX[user.avatarSize || 'medium']}/>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
                <div style={{fontSize: 17, fontWeight: 700, color: C.pinkDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  {user.nickname}'s room
                </div>
                <button onClick={() => setShowSettings(true)} style={{background: 'none', border: 'none', color: C.muted, cursor: 'pointer', opacity: 0.8, lineHeight: 1, flexShrink: 0, display: 'flex'}}>
                  <Icon name="settings" size={32}/>
                </button>
              </div>
              <div style={{fontSize: 14, fontWeight: 600, color: C.pinkDark, opacity: 0.8, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                🐾 {user.statusMessage || '상태메시지를 설정해보세요'}
              </div>
            </div>
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: -8}}>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: 11, color: C.muted}}>{formatDateLabel(selectedDate)}</div>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 16, fontWeight: 700, color: C.pinkDark}}>{rate}% 완료 <Icon name="award" size={16} color={rate === 100 ? C.pinkDark : C.muted} strokeWidth={rate === 100 ? 2.4 : 1.8}/></div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div style={{padding: 16, paddingBottom: 150}}>

          {tab === 'home' && <>
            <div style={{background: 'linear-gradient(135deg, #FFD6E7, #E8D5FF)', borderRadius: 20, padding: 20, marginBottom: 16, color: C.pinkDark}}>
              <div style={{fontSize: 13, opacity: 0.8, marginBottom: 8}}>{isToday ? '오늘' : formatDateShort(selectedDate)}의 진행률</div>
              {selectedTodos.length === 0 ? (
                <>
                  <div style={{fontSize: 15, fontWeight: 700, marginBottom: 10, color: C.pinkDark}}>아직 추가한 할 일이 없어요</div>
                  <div style={{height: 8, background: 'rgba(255,255,255,0.55)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.8)'}}/>
                </>
              ) : (
                <>
                  <div style={{fontSize: 36, fontWeight: 800, marginBottom: 10, color: C.pinkDark}}>{rate}%</div>
                  <div style={{height: 8, background: 'rgba(255,255,255,0.55)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.8)'}}>
                    <div style={{width: `${Math.max(rate, 4)}%`, height: '100%', background: `linear-gradient(90deg, ${C.pinkDark}, ${C.lavender})`, borderRadius: 4, transition: 'width 0.5s'}}/>
                  </div>
                  <div style={{fontSize: 12, opacity: 0.8, marginTop: 6}}>{completed.length}/{selectedTodos.length} 완료</div>
                </>
              )}
            </div>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8}}>
              <div style={{fontSize: 12, color: C.muted, fontWeight: 600, flexShrink: 0}}>{isToday ? '오늘' : formatDateShort(selectedDate)} 할 일</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6, position: 'relative', minWidth: 0}}>
                <button onClick={() => setShowCategoryFilterMenu(v => !v)}
                        style={{display: 'flex', alignItems: 'center', gap: 4, background: categoryFilter !== 'ALL' ? '#FFE4F0' : 'none', border: `1px solid ${categoryFilter !== 'ALL' ? C.pinkDark : C.border}`, borderRadius: 12, padding: '4px 10px', fontSize: 11, color: C.pinkDark, cursor: 'pointer', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  <Icon name="palette" size={12}/>
                  {categoryFilter === 'ALL' ? '카테고리' : (groups.find(g => (g.id ?? 'NONE') === categoryFilter)?.name || '카테고리')}
                </button>
                <button onClick={() => setShowRoutines(true)}
                        style={{display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, padding: '4px 10px', fontSize: 11, color: C.pinkDark, cursor: 'pointer', flexShrink: 0}}>
                  <Icon name="repeat" size={12}/> 루틴 보기
                </button>

                {showCategoryFilterMenu && (
                    <>
                      <div onClick={() => setShowCategoryFilterMenu(false)} style={{position: 'fixed', inset: 0, zIndex: 89}}/>
                      <div style={{position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'white', borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(255,143,171,0.2)', zIndex: 90, minWidth: 140, maxHeight: 220, overflowY: 'auto'}}>
                        <button onClick={() => { setCategoryFilter('ALL'); setShowCategoryFilterMenu(false); }}
                                style={{width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: categoryFilter === 'ALL' ? '#FFF0F5' : 'white', color: C.text, fontSize: 12, fontWeight: categoryFilter === 'ALL' ? 700 : 400, cursor: 'pointer'}}>
                          전체 보기
                        </button>
                        {groups.map(group => {
                          const key = group.id ?? 'NONE';
                          return (
                              <button key={key} onClick={() => { setCategoryFilter(key); setShowCategoryFilterMenu(false); }}
                                      style={{width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: categoryFilter === key ? '#FFF0F5' : 'white', color: C.text, fontSize: 12, fontWeight: categoryFilter === key ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}>
                                <span style={{display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: group.color || C.pink, flexShrink: 0}}/>
                                <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{group.name}</span>
                              </button>
                          );
                        })}
                      </div>
                    </>
                )}
              </div>
            </div>

            {visibleGroups.map(group => (
                <CategoryGroup key={group.id ?? 'none'} group={group}
                               onAdd={openForm} onToggle={toggleComplete} onDelete={deleteTodo} onEdit={openEditForm}/>
            ))}

            {visibleGroups.length === 0 && (
                <div style={{textAlign: 'center', padding: '30px 20px 40px', color: C.muted}}>
                  <div style={{marginBottom: 8, display: 'flex', justifyContent: 'center'}}>
                    <Icon name="paw" size={36} color={C.pink} strokeWidth={1.5}/>
                  </div>
                  <div style={{marginBottom: 16}}>{categoryFilter !== 'ALL' ? '이 카테고리엔 할 일이 없어요!' : `${isToday ? '오늘' : '이 날은'} 할 일이 없어요!`}</div>
                  <button onClick={() => openForm(categoryFilter !== 'ALL' && categoryFilter !== 'NONE' ? categoryFilter : undefined)}
                          style={{padding: '10px 22px', borderRadius: 16, border: 'none', background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer'}}>
                    + 할 일 추가하기
                  </button>
                </div>
            )}
          </>}

          {tab === 'calendar' && <>
            <CalendarView selectedDate={selectedDate} onSelect={setSelectedDate} todos={todos} exclusions={routineExclusions}/>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 8px', gap: 8}}>
              <div style={{fontSize: 12, color: C.muted, fontWeight: 600, flexShrink: 0}}>
                {isToday ? '오늘' : formatDateShort(selectedDate)} 할 일
              </div>
              <div style={{position: 'relative'}}>
                <button onClick={() => setShowCalendarCategoryFilterMenu(v => !v)}
                        style={{display: 'flex', alignItems: 'center', gap: 4, background: calendarCategoryFilter !== 'ALL' ? '#FFE4F0' : 'none', border: `1px solid ${calendarCategoryFilter !== 'ALL' ? C.pinkDark : C.border}`, borderRadius: 12, padding: '4px 10px', fontSize: 11, color: C.pinkDark, cursor: 'pointer', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  <Icon name="palette" size={12}/>
                  {calendarCategoryFilter === 'ALL' ? '카테고리' : (groups.find(g => (g.id ?? 'NONE') === calendarCategoryFilter)?.name || '카테고리')}
                </button>
                {showCalendarCategoryFilterMenu && (
                    <>
                      <div onClick={() => setShowCalendarCategoryFilterMenu(false)} style={{position: 'fixed', inset: 0, zIndex: 89}}/>
                      <div style={{position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'white', borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(255,143,171,0.2)', zIndex: 90, minWidth: 140, maxHeight: 220, overflowY: 'auto'}}>
                        <button onClick={() => { setCalendarCategoryFilter('ALL'); setShowCalendarCategoryFilterMenu(false); }}
                                style={{width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: calendarCategoryFilter === 'ALL' ? '#FFF0F5' : 'white', color: C.text, fontSize: 12, fontWeight: calendarCategoryFilter === 'ALL' ? 700 : 400, cursor: 'pointer'}}>
                          전체 보기
                        </button>
                        {groups.map(group => {
                          const key = group.id ?? 'NONE';
                          return (
                              <button key={key} onClick={() => { setCalendarCategoryFilter(key); setShowCalendarCategoryFilterMenu(false); }}
                                      style={{width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: calendarCategoryFilter === key ? '#FFF0F5' : 'white', color: C.text, fontSize: 12, fontWeight: calendarCategoryFilter === key ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}>
                                <span style={{display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: group.color || C.pink, flexShrink: 0}}/>
                                <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{group.name}</span>
                              </button>
                          );
                        })}
                      </div>
                    </>
                )}
              </div>
            </div>
            {(() => {
              const calendarTodos = sortByColor(selectedTodos).filter(t =>
                  calendarCategoryFilter === 'ALL' || (t.categoryId ?? 'NONE') === calendarCategoryFilter);
              if (calendarTodos.length === 0) {
                return (
                    <div style={{textAlign: 'center', padding: 20, color: C.muted}}>
                      <div style={{display: 'flex', justifyContent: 'center', marginBottom: 6, opacity: 0.6}}><Icon name="calendar" size={26} color={C.muted}/></div>
                      <div>{calendarCategoryFilter !== 'ALL' ? '이 카테고리엔 할 일이 없어요' : '이 날은 할 일이 없어요'}</div>
                    </div>
                );
              }
              return calendarTodos.map(todo => (
                  <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo} onEdit={openEditForm}/>
              ));
            })()}
          </>}

          {tab === 'timer' && <TimerTab/>}
          {tab === 'memo' && <MemoTab/>}
        </div>

        {/* 입력 폼 */}
        {showForm && (
            <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 40px', boxShadow: `0 -4px 30px rgba(255,143,171,0.2)`, zIndex: 100, boxSizing: 'border-box'}}>
              <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
              <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: C.pink, marginBottom: 14}}><Icon name="paw" size={15} color={C.pink}/> {editingId ? '할 일 수정' : '새로운 할 일'}</div>
              <input placeholder="할 일 제목 *" value={form.title}
                     onChange={e => setForm({...form, title: e.target.value})} style={inp}/>
              <input placeholder="메모 (선택)" value={form.memo}
                     onChange={e => setForm({...form, memo: e.target.value})} style={inp}/>
              <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}
                      style={{...inp, color: C.text}}>
                <option value="">카테고리 없음</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" value={form.dueDate}
                     onChange={e => setForm({...form, dueDate: e.target.value, endDate: form.endDate && form.endDate < e.target.value ? e.target.value : form.endDate})}
                     style={{...inp, width: '100%', WebkitAppearance: 'none', appearance: 'none', display: 'block'}}/>
              <label style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, margin: '10px 2px 4px', cursor: 'pointer'}}>
                <input type="checkbox" checked={form.endDate !== ''}
                       onChange={e => setForm({...form, endDate: e.target.checked ? form.dueDate : ''})}
                       style={{width: 16, height: 16, cursor: 'pointer'}}/>
                <Icon name="calendar" size={14} color={C.pink}/> 기간으로 설정
              </label>
              {form.endDate !== '' && (
                  <input type="date" value={form.endDate} min={form.dueDate}
                         onChange={e => setForm({...form, endDate: e.target.value})}
                         style={{...inp, width: '100%', WebkitAppearance: 'none', appearance: 'none', display: 'block'}}/>
              )}
              <div style={{height: 1, background: C.border, margin: '12px 2px'}}/>
              <label style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, margin: '4px 2px', cursor: 'pointer'}}>
                <input type="checkbox" checked={form.isRoutine}
                       onChange={e => setForm({...form, isRoutine: e.target.checked})}
                       style={{width: 16, height: 16, cursor: 'pointer'}}/>
                <Icon name="repeat" size={13}/> 루틴으로 표시 (반복되는 일정)
              </label>
              <div style={{display: 'flex', gap: 8, marginTop: 4}}>
                <button onClick={() => { setShowForm(false); setEditingId(null); setEditingTodo(null); }} style={{flex: 1, padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, cursor: 'pointer', color: C.muted}}>취소</button>
                <button onClick={saveTodo} style={{flex: 2, padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer'}}>{editingId ? '저장' : '추가'} ✨</button>
              </div>
            </div>
        )}

        {/* 카테고리 관리 모달 */}
        {showCatManager && (
            <CategoryManager categories={categories} onClose={() => setShowCatManager(false)} onChanged={refresh}/>
        )}

        {/* 루틴 모아보기 모달 */}
        {showRoutines && (
            <RoutineManager onClose={() => setShowRoutines(false)}/>
        )}

        {/* 루틴 할 일 삭제 선택 모달: 이 날짜만 vs 전체 */}
        {deleteChoice && (
            <DeleteRoutineChoiceModal
                title={deleteChoice.title}
                dateLabel={selectedDate}
                onDeleteOccurrence={deleteRoutineOccurrence}
                onDeleteAll={deleteRoutineAll}
                onCancel={() => setDeleteChoice(null)}/>
        )}

        {/* 루틴 할 일 수정 선택 모달: 이 날짜만 vs 전체 */}
        {editChoice && (
            <EditRoutineChoiceModal
                title={editChoice.title}
                dateLabel={editChoice.date}
                onEditOccurrence={saveEditOccurrence}
                onEditAll={saveEditAll}
                onCancel={() => setEditChoice(null)}/>
        )}

        {/* 설정 모달 */}
        {showSettings && (
            <SettingsModal user={user} onClose={() => setShowSettings(false)} onLogout={handleLogout} onWithdraw={handleWithdrawn} onProfileSaved={handleProfileSaved}/>
        )}

        {/* + 버튼 메뉴 (할 일 추가 / 카테고리 관리) */}
        {showPlusMenu && (
            <PlusMenu onClose={() => setShowPlusMenu(false)}
                      onAddTodo={() => { setShowPlusMenu(false); openForm(null); }}
                      onManageCategories={() => { setShowPlusMenu(false); setShowCatManager(true); }}/>
        )}

        {/* 100% 달성 축하 모달 */}
        {showCelebration && (
            <div onClick={() => setShowCelebration(false)}
                 style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24}}>
              <div onClick={e => e.stopPropagation()}
                   style={{background: 'white', borderRadius: 26, padding: '30px 26px 28px', textAlign: 'center', maxWidth: 300, boxShadow: '0 24px 60px rgba(0,0,0,0.3)'}}>
                {/* 설정한 프로필(아바타)이 직접 말하는 것처럼 보이도록 말풍선으로 감싼 인사말 */}
                <div style={{position: 'relative', display: 'inline-block', background: '#FFF0F5', borderRadius: 18, padding: '14px 18px', marginBottom: 16, maxWidth: '100%'}}>
                  <div style={{fontSize: 17, fontWeight: 800, color: C.pinkDark, marginBottom: 4}}>오늘 할 일 다 끝냈다!</div>
                  <div style={{fontSize: 12, color: C.muted, lineHeight: 1.5}}>완벽한 하루였어, 진짜 잘했어! 🎉</div>
                  <div style={{position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '9px solid #FFF0F5'}}/>
                </div>
                <div style={{display: 'flex', justifyContent: 'center'}}><Avatar user={user} size={66}/></div>
                <button onClick={() => setShowCelebration(false)}
                        style={{marginTop: 18, padding: '13px 30px', borderRadius: 16, border: 'none', background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer'}}>
                  고마워!
                </button>
              </div>
            </div>
        )}

        {/* 하단 탭바 */}
        {!showForm && (
            <div style={{position: 'fixed', bottom: 4, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: C.white, borderTop: `1px solid ${C.border}`, borderRadius: 18, display: 'flex', alignItems: 'center', paddingBottom: 'calc(4px + env(safe-area-inset-bottom))', paddingTop: '8px', zIndex: 50, boxShadow: '0 -2px 10px rgba(255,143,171,0.08)'}}>
              <button onClick={() => setTab('home')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'home' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{background: tab === 'home' ? '#FFE4F0' : 'transparent', borderRadius: 12, padding: '3px 14px', transition: 'background 0.15s'}}><Icon name="home" size={22} color={tab === 'home' ? C.pink : C.muted} strokeWidth={tab === 'home' ? 2.1 : 1.8}/></div>
                <div style={{fontWeight: tab === 'home' ? 700 : 400, marginTop: 2}}>홈</div>
              </button>
              <button onClick={() => setTab('calendar')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'calendar' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{background: tab === 'calendar' ? '#FFE4F0' : 'transparent', borderRadius: 12, padding: '3px 14px', transition: 'background 0.15s'}}><Icon name="calendar" size={21} color={tab === 'calendar' ? C.pink : C.muted} strokeWidth={tab === 'calendar' ? 2.1 : 1.8}/></div>
                <div style={{fontWeight: tab === 'calendar' ? 700 : 400, marginTop: 2}}>캘린더</div>
              </button>

              {/* 중앙 플러스 추가 버튼: 다른 탭과 같은 높이로 배치 */}
              <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button
                    onClick={() => setShowPlusMenu(true)}
                    style={{
                      width: 46, height: 46, borderRadius: 23,
                      background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`,
                      color: 'white', fontSize: 26, fontWeight: 700, border: 'none',
                      cursor: 'pointer', boxShadow: `0 4px 14px rgba(255,92,138,0.4)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  +
                </button>
              </div>

              <button onClick={() => setTab('timer')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'timer' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{background: tab === 'timer' ? '#FFE4F0' : 'transparent', borderRadius: 12, padding: '3px 14px', transition: 'background 0.15s'}}><Icon name="timer" size={21} color={tab === 'timer' ? C.pink : C.muted} strokeWidth={tab === 'timer' ? 2.1 : 1.8}/></div>
                <div style={{fontWeight: tab === 'timer' ? 700 : 400, marginTop: 2}}>타이머</div>
              </button>
              <button onClick={() => setTab('memo')} style={{flex: 1, padding: '4px 0', border: 'none', background: 'transparent', color: tab === 'memo' ? C.pink : C.muted, fontSize: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{background: tab === 'memo' ? '#FFE4F0' : 'transparent', borderRadius: 12, padding: '3px 14px', transition: 'background 0.15s'}}><Icon name="note" size={20} color={tab === 'memo' ? C.pink : C.muted} strokeWidth={tab === 'memo' ? 2.1 : 1.8}/></div>
                <div style={{fontWeight: tab === 'memo' ? 700 : 400, marginTop: 2}}>메모</div>
              </button>
            </div>
        )}
      </div>
  );
}

function TodoCard({ todo, onToggle, onDelete, onEdit, compact, hideCategory }) {
  // 체크박스 색: 카테고리 색이 있으면 그 색, 없으면 우선순위 색
  const accent = todo.categoryColor || PRIORITY_COLOR[todo.priority] || C.pink;
  return (
      <div onClick={() => onEdit && onEdit(todo)} style={{background: compact ? 'transparent' : C.card, borderRadius: compact ? 0 : 14, padding: compact ? '8px 0' : 14, marginBottom: compact ? 0 : 10, display: 'flex', alignItems: 'center', gap: 10, borderBottom: compact ? `1px solid ${C.border}` : 'none', border: compact ? 'none' : `1px solid ${C.border}`, cursor: onEdit ? 'pointer' : 'default'}}>
        <button onClick={(e) => { e.stopPropagation(); onToggle(todo.id); }} style={{width: 26, height: 26, borderRadius: 13, border: `2px solid ${accent}`, background: todo.completed ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0}}>
          {todo.completed && <span style={{color: 'white', fontSize: 13}}>✓</span>}
        </button>
        <div style={{flex: 1}}>
          <div style={{fontSize: 14, fontWeight: 500, color: todo.completed ? C.muted : C.text, textDecoration: todo.completed ? 'line-through' : 'none'}}>
            {todo.title}
          </div>
          {todo.memo && <div style={{fontSize: 11, color: C.muted, marginTop: 2}}>{todo.memo}</div>}
          <div style={{display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap'}}>
            {!hideCategory && todo.category && (
                <span style={{fontSize: 10, color: todo.categoryColor || C.pinkDark, background: todo.categoryColor ? todo.categoryColor + '22' : '#FFE4F0', padding: '1px 7px', borderRadius: 8}}>
                  {todo.category}
                </span>
            )}
            {todo.endDate && todo.endDate !== todo.dueDate && (
                <span style={{display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: C.muted, background: '#F5F0FF', padding: '1px 7px', borderRadius: 8}}>
                  <Icon name="calendar" size={10} color={C.muted}/> {formatDateMD(todo.dueDate)}~{formatDateMD(todo.endDate)}
                </span>
            )}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(todo); }} style={{background: 'none', border: 'none', color: C.muted, cursor: 'pointer', opacity: 0.5, display: 'flex'}}><Icon name="trash" size={15}/></button>
      </div>
  );
}

// "색깔 알약 헤더 + 아래 할 일 목록" 한 덩어리
function CategoryGroup({ group, onAdd, onToggle, onDelete, onEdit }) {
  const color = group.color || C.pink;
  return (
      <div style={{marginBottom: 16}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, background: color + '22', border: `1px solid ${color}55`, borderRadius: 20, padding: '4px 6px 4px 12px', marginBottom: 8}}>
          <span style={{width: 8, height: 8, borderRadius: 4, background: color}}/>
          <span style={{fontSize: 13, fontWeight: 700, color}}>{group.name}</span>
          <button onClick={() => onAdd(group.id)}
                  style={{width: 22, height: 22, borderRadius: 11, border: 'none', background: color, color: 'white', fontSize: 15, lineHeight: 1, cursor: 'pointer'}}>+</button>
        </div>
        {group.todos.map(todo => (
            <TodoCard key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} hideCategory/>
        ))}
      </div>
  );
}

// + 버튼 메뉴: 할 일 추가 / 카테고리 관리를 한 곳에서 선택
function PlusMenu({ onClose, onAddTodo, onManageCategories }) {
  return (
      <div onClick={onClose} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 480, background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 32px', boxSizing: 'border-box'}}>
          <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
          <button onClick={onAddTodo}
                  style={{width: '100%', textAlign: 'left', padding: '16px', borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 15, fontWeight: 600, color: C.text, cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12}}>
            <Icon name="note" size={18} color={C.pink}/> 새 할 일 추가
          </button>
          <button onClick={onManageCategories}
                  style={{width: '100%', textAlign: 'left', padding: '16px', borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 15, fontWeight: 600, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12}}>
            <Icon name="palette" size={18} color={C.pink}/> 카테고리 관리
          </button>
        </div>
      </div>
  );
}

// 프로필 / 계정 관리 모달
// 프로필 아바타: 사진을 쓰기로 했고 실제로 로드되면 사진, 아니면 이모티콘
function Avatar({ user, size, previewUrl }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [user.avatarPhotoVersion, user.avatarType, previewUrl]);

  const showPhoto = user.avatarType === 'photo' && !imgFailed;
  if (showPhoto) {
    // previewUrl: 설정 탭에서 아직 저장 전인 새 사진을 미리 보여줄 때 씀 (이땐 서버 대신 이 로컬 미리보기를 씀)
    const photoUrl = previewUrl || `${API}/account/avatar-image?nickname=${encodeURIComponent(user.nickname)}&v=${user.avatarPhotoVersion || 0}`;
    return (
        <img src={photoUrl} alt="프로필 사진" onError={() => setImgFailed(true)}
             style={{width: size, height: size, borderRadius: size / 2, objectFit: 'cover', flexShrink: 0}}/>
    );
  }
  return (
      <span style={{
        width: size, height: size, borderRadius: size / 2, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.9)',
        fontSize: Math.round(size * 0.6), lineHeight: 1
      }}>{user.avatarEmoji || '🐈‍⬛'}</span>
  );
}

const AVATAR_EMOJIS = ['🐈‍⬛', '🐶', '🐰', '🐼', '🦊', '🐹', '🐧', '🦄', '🐢', '🐙', '🦁', '🐸'];

// 로그인 방식 표시용 (설정 탭 "계정 정보")
const PROVIDER_LABEL = { LOCAL: '이메일', GOOGLE: '구글', KAKAO: '카카오' };

// 아바타 표시 크기 (작게/보통/크게) - 헤더용, 설정 카드용 각각의 픽셀 크기
const AVATAR_HEADER_PX = { small: 40, medium: 54, large: 68 };
const AVATAR_CARD_PX = { small: 34, medium: 48, large: 64 };


// 프로필 사진 위치/확대 조절 모달: 드래그로 이동, 슬라이더로 확대, 원형 미리보기 그대로 잘라서 업로드
function PhotoCropModal({ file, onCancel, onConfirm }) {
  const DISPLAY = 260;
  const OUTPUT = 480;
  const [imgUrl, setImgUrl] = useState(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = natural.w ? Math.max(DISPLAY / natural.w, DISPLAY / natural.h) : 1;
  const effScale = baseScale * zoom;
  const dw = natural.w * effScale;
  const dh = natural.h * effScale;

  const clamp = (x, y) => {
    const minX = Math.min(0, DISPLAY - dw);
    const minY = Math.min(0, DISPLAY - dh);
    return { x: Math.max(minX, Math.min(0, x)), y: Math.max(minY, Math.min(0, y)) };
  };

  const onImgLoad = (e) => {
    const w = e.target.naturalWidth, h = e.target.naturalHeight;
    const bScale = Math.max(DISPLAY / w, DISPLAY / h);
    const initDw = w * bScale, initDh = h * bScale;
    setNatural({ w, h });
    setZoom(1);
    setPos({ x: (DISPLAY - initDw) / 2, y: (DISPLAY - initDh) / 2 });
  };

  const handleZoomChange = (newZoom) => {
    const newEff = baseScale * newZoom;
    const ndw = natural.w * newEff, ndh = natural.h * newEff;
    const cx = dw ? (DISPLAY / 2 - pos.x) / dw : 0.5;
    const cy = dh ? (DISPLAY / 2 - pos.y) / dh : 0.5;
    const newX = DISPLAY / 2 - cx * ndw;
    const newY = DISPLAY / 2 - cy * ndh;
    setZoom(newZoom);
    setPos(clamp(newX, newY));
  };

  const startDrag = (clientX, clientY) => {
    dragStart.current = { x: clientX, y: clientY, px: pos.x, py: pos.y };
    setDragging(true);
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setPos(clamp(dragStart.current.px + dx, dragStart.current.py + dy));
  };
  const endDrag = () => setDragging(false);

  const handleConfirm = () => {
    if (!imgRef.current || !natural.w) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    const sx = -pos.x / effScale;
    const sy = -pos.y / effScale;
    const sSize = DISPLAY / effScale;
    ctx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onConfirm(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  return (
      <div onClick={onCancel} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{background: 'white', borderRadius: 20, padding: 22, width: 300, boxSizing: 'border-box', textAlign: 'center'}}>
          <div style={{fontSize: 14, fontWeight: 700, color: C.pinkDark, marginBottom: 14}}>사진 위치 · 크기 조절</div>
          <div
              onMouseDown={e => startDrag(e.clientX, e.clientY)}
              onMouseMove={e => moveDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={e => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={endDrag}
              style={{width: DISPLAY, height: DISPLAY, borderRadius: '50%', overflow: 'hidden', margin: '0 auto', position: 'relative', background: '#f1f1f1', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none'}}>
            {imgUrl && (
                <img ref={imgRef} src={imgUrl} alt="미리보기" onLoad={onImgLoad} draggable={false}
                     style={{position: 'absolute', left: pos.x, top: pos.y, width: dw || 'auto', height: dh || 'auto', maxWidth: 'none', userSelect: 'none'}}/>
            )}
          </div>
          <input type="range" min="1" max="3" step="0.01" value={zoom}
                 onChange={e => handleZoomChange(parseFloat(e.target.value))}
                 style={{width: '100%', marginTop: 18}}/>
          <div style={{display: 'flex', gap: 8, marginTop: 16}}>
            <button onClick={onCancel}
                    style={{flex: 1, padding: '11px 0', borderRadius: 12, border: `1px solid ${C.border}`, background: 'white', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>취소</button>
            <button onClick={handleConfirm}
                    style={{flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer'}}>확인</button>
          </div>
        </div>
      </div>
  );
}

function SettingsModal({ user, onClose, onLogout, onWithdraw, onProfileSaved }) {
  // 전부 "저장" 버튼 한 번에 반영되는 임시(staged) 값들. 저장 누르기 전엔 서버로 아무것도 안 나감
  const [nickname, setNickname] = useState(user.nickname);
  const [statusMessage, setStatusMessage] = useState(user.statusMessage || '');
  const [avatarEmoji, setAvatarEmoji] = useState(user.avatarEmoji || '🐈‍⬛');
  const [avatarSize, setAvatarSize] = useState(user.avatarSize || 'medium');
  const [avatarType, setAvatarType] = useState(user.avatarType || 'emoji');
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);   // 새로 고른(크롭한) 사진 파일. 저장 누를 때 업로드됨
  const [pendingPhotoPreviewUrl, setPendingPhotoPreviewUrl] = useState(null);
  const [removePhotoFlag, setRemovePhotoFlag] = useState(false);    // "사진 삭제"를 눌렀지만 아직 저장 전

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const photoInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // 새로 고른 사진 미리보기 URL은 컴포넌트 떠날 때/바뀔 때 정리
  useEffect(() => {
    return () => { if (pendingPhotoPreviewUrl) URL.revokeObjectURL(pendingPhotoPreviewUrl); };
  }, [pendingPhotoPreviewUrl]);

  // 주의: nickname은 일부러 안 덮어씀. Avatar가 사진 URL을 만들 때 여기 nickname을 쓰는데,
  // 아직 저장 안 한(입력 중인) 닉네임으로 조회하면 서버에 없는 닉네임이라 사진 요청이 실패해서
  // 저장하지도 않았는데 사진이 기본 이모지로 바뀌어 보이는 버그가 있었음
  const previewUser = { ...user, avatarEmoji, avatarSize, avatarType };

  const dirty = nickname.trim() !== user.nickname
      || statusMessage.trim() !== (user.statusMessage || '')
      || avatarEmoji !== (user.avatarEmoji || '🐈‍⬛')
      || avatarSize !== (user.avatarSize || 'medium')
      || avatarType !== (user.avatarType || 'emoji')
      || !!pendingPhotoFile
      || removePhotoFlag;

  const pickAvatar = (emoji) => {
    setAvatarEmoji(emoji);
    setAvatarType('emoji');
    setError('');
  };

  const handlePhotoFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setCropFile(file);
  };

  const handleCropCancel = () => setCropFile(null);

  // 사진은 여기서 바로 업로드하지 않고, 미리보기만 만들어서 "저장" 누를 때 같이 올라가게 함
  const handleCropConfirm = (croppedFile) => {
    setCropFile(null);
    if (pendingPhotoPreviewUrl) URL.revokeObjectURL(pendingPhotoPreviewUrl);
    setPendingPhotoFile(croppedFile);
    setPendingPhotoPreviewUrl(URL.createObjectURL(croppedFile));
    setRemovePhotoFlag(false);
    setAvatarType('photo');
  };

  const stagePhotoRemoval = () => {
    if (pendingPhotoPreviewUrl) URL.revokeObjectURL(pendingPhotoPreviewUrl);
    setPendingPhotoFile(null);
    setPendingPhotoPreviewUrl(null);
    setRemovePhotoFlag(true);
    setAvatarType('emoji');
  };

  const doLogout = () => {
    if (!window.confirm('로그아웃 할까요?')) return;
    onLogout();
  };

  // 회원 탈퇴: 모든 할 일/카테고리/메모/타이머 기록/프로필 사진이 영구히 삭제되고 되돌릴 수 없어서 두 번 확인받음
  const doWithdraw = async () => {
    if (!window.confirm('정말 탈퇴하시겠어요? 모든 할 일, 카테고리, 메모, 타이머 기록이 영구적으로 삭제되고 되돌릴 수 없어요.')) return;
    if (!window.confirm('한 번 더 확인할게요. 정말 탈퇴할까요?')) return;
    setWithdrawing(true);
    try {
      await axios.delete(`${API}/account`);
      onWithdraw();
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setWithdrawing(false);
    }
  };

  // 저장 버튼 하나로 닉네임/상태메시지/아바타(이모지·크기·타입)/사진 변경·삭제를 전부 한 번에 반영
  const saveAll = async () => {
    const trimmedName = nickname.trim();
    if (!trimmedName) { setError('닉네임을 입력해 주세요.'); return; }
    setSaving(true);
    setError('');
    try {
      let latestNickname = user.nickname;
      let latestToken = null;
      if (trimmedName !== user.nickname) {
        const res = await axios.patch(`${API}/account/nickname`, { newNickname: trimmedName });
        latestNickname = res.data.nickname;
        latestToken = res.data.token;
        // 새 토큰을 여기서 바로 반영해야 함. 안 그러면 바로 다음에 이어지는 사진 업로드/프로필 저장 요청이
        // 아직 로컬에 남아있는 "예전 닉네임" 토큰으로 인증되면서, 서버가 방금 바꾼 닉네임을 못 찾아
        // 자동복구 로직으로 도로 되돌려버리고(닉네임 롤백) 사진도 예전 닉네임 밑에 저장되는 버그가 있었음
        localStorage.setItem('todi_token', latestToken);
      }

      let photoVersion = user.avatarPhotoVersion;
      let hasPhoto = user.hasPhoto;
      if (pendingPhotoFile) {
        const formData = new FormData();
        formData.append('file', pendingPhotoFile);
        await axios.post(`${API}/account/avatar-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoVersion = Date.now();
        hasPhoto = true;
      } else if (removePhotoFlag) {
        await axios.delete(`${API}/account/avatar-image`);
        hasPhoto = false;
      }

      await axios.patch(`${API}/account/profile`, {
        statusMessage: statusMessage.trim(),
        avatarEmoji,
        avatarSize,
        avatarType,
      });

      onProfileSaved({
        nickname: latestNickname,
        token: latestToken,
        statusMessage: statusMessage.trim(),
        avatarEmoji,
        avatarSize,
        avatarType,
        avatarPhotoVersion: photoVersion,
        hasPhoto,
      });

      setPendingPhotoFile(null);
      setPendingPhotoPreviewUrl(null);
      setRemovePhotoFlag(false);
      setShowAvatarPicker(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
      <>
      {cropFile && <PhotoCropModal file={cropFile} onCancel={handleCropCancel} onConfirm={handleCropConfirm}/>}
      <div onClick={onClose} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 32px', boxSizing: 'border-box'}}>
          <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: C.pink, marginBottom: 14}}><Icon name="settings" size={24}/> 설정</div>

          {/* 프로필 카드 */}
          <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, #FFD6E7, #E8D5FF)', borderRadius: 18, padding: '18px 16px', marginBottom: 8}}>
            <button onClick={() => setShowAvatarPicker(v => !v)}
                    style={{width: AVATAR_CARD_PX[avatarSize] + 18, height: AVATAR_CARD_PX[avatarSize] + 18, borderRadius: (AVATAR_CARD_PX[avatarSize] + 18) / 2, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer'}}>
              <Avatar user={previewUser} size={AVATAR_CARD_PX[avatarSize]} previewUrl={pendingPhotoPreviewUrl}/>
            </button>
            <div style={{flex: 1, minWidth: 0}}>
              <input value={nickname} maxLength={30} onChange={e => setNickname(e.target.value)}
                     style={{width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.pinkDark}`, fontSize: 15, fontWeight: 700, color: C.pinkDark, marginBottom: 4, boxSizing: 'border-box', background: 'rgba(255,255,255,0.6)'}}/>
              <div style={{fontSize: 12, color: C.pinkDark, opacity: 0.75}}>Todi 스터디 플래너</div>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'flex-start', gap: 3, fontSize: 10, color: C.muted, marginBottom: 14}}>
            <Icon name="alert" size={10} color={C.muted}/> 욕설·비방 등 부적절한 닉네임은 사용하지 말아주세요
          </div>

          {showAvatarPicker && (
              <div style={{marginBottom: 18, background: '#FFF5F9', borderRadius: 14, padding: 12}}>
                <div style={{fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6}}>아바타 크기</div>
                <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                  {[['small', '작게'], ['medium', '보통'], ['large', '크게']].map(([size, label]) => (
                      <button key={size} onClick={() => setAvatarSize(size)}
                              style={{flex: 1, padding: '8px 0', borderRadius: 10, border: avatarSize === size ? `2px solid ${C.pinkDark}` : `1px solid ${C.border}`, background: 'white', color: C.pinkDark, fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>
                        {label}
                      </button>
                  ))}
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10}}>
                  {AVATAR_EMOJIS.map(e => (
                      <button key={e} onClick={() => pickAvatar(e)}
                              style={{width: 38, height: 38, borderRadius: 19, border: (avatarType !== 'photo' && avatarEmoji === e) ? `2px solid ${C.pinkDark}` : `1px solid ${C.border}`, background: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        {e}
                      </button>
                  ))}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{display: 'none'}} onChange={handlePhotoFile}/>
                <div style={{display: 'flex', gap: 8}}>
                  <button onClick={() => photoInputRef.current && photoInputRef.current.click()}
                          style={{flex: 1, padding: '10px 0', borderRadius: 12, border: `1px solid ${C.border}`, background: 'white', color: C.pinkDark, fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: 4}}><Icon name="camera" size={13}/> 사진으로 설정</span>
                  </button>
                  {avatarType === 'photo' && (
                      <button onClick={stagePhotoRemoval}
                              style={{flex: 1, padding: '10px 0', borderRadius: 12, border: `1px solid ${C.border}`, background: 'white', color: C.muted, fontSize: 12, cursor: 'pointer'}}>
                        사진 삭제
                      </button>
                  )}
                </div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: 3, fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.4}}>
                  <Icon name="alert" size={10} color={C.muted}/> 선정적·폭력적이거나 타인에게 불쾌감을 줄 수 있는 사진은 올리지 말아주세요. 사진은 "저장" 눌러야 실제로 반영돼요
                </div>
              </div>
          )}

          <div style={{fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8}}>상태메시지</div>
          <input value={statusMessage} maxLength={40} placeholder="상태메시지를 입력해 보세요"
                 onChange={e => setStatusMessage(e.target.value)}
                 style={{...inp, marginBottom: 4}}/>
          <div style={{display: 'flex', alignItems: 'flex-start', gap: 3, fontSize: 10, color: C.muted, marginBottom: 18}}>
            <Icon name="alert" size={10} color={C.muted}/> 욕설·비방 등 부적절한 문구는 사용하지 말아주세요
          </div>

          {/* 저장 버튼: 닉네임/상태메시지/아바타/사진 변경 전부 여기 한 번으로 저장됨 */}
          <button onClick={saveAll} disabled={saving || !dirty}
                  style={{width: '100%', padding: 14, borderRadius: 14, border: 'none',
                    background: (saving || !dirty) ? C.border : `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`,
                    color: (saving || !dirty) ? C.muted : 'white', fontSize: 14, fontWeight: 700,
                    cursor: (saving || !dirty) ? 'default' : 'pointer', marginBottom: 8}}>
            {saving ? '저장 중...' : (saved ? '저장됐어요 ✓' : '저장')}
          </button>
          {error && <div style={{display: 'flex', alignItems: 'center', gap: 4, color: '#FF5252', fontSize: 12, marginBottom: 14}}><Icon name="alert" size={12} color="#FF5252"/> {error}</div>}

          {/* 계정 정보: 어떤 계정으로 로그인했는지 확인용 (수정 불가) */}
          <div style={{fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8, marginTop: 10}}>계정 정보</div>
          <div style={{padding: '14px 16px', borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', marginBottom: 8}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.text}}>
              <Icon name="mail" size={15} color={C.muted}/>
              {user.email && !user.email.endsWith('@users.todi') ? user.email : '이메일 비공개'}
            </div>
            <div style={{fontSize: 12, color: C.muted, marginTop: 4, marginLeft: 23}}>
              {PROVIDER_LABEL[user.provider] || user.provider || '알 수 없음'} 계정으로 로그인 중
            </div>
          </div>

          <div style={{fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8, marginTop: 10}}>계정</div>
          <button onClick={doLogout}
                  style={{width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: C.text, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10}}>
            <Icon name="logout" size={17} color={C.text}/> 로그아웃
          </button>
          <button onClick={doWithdraw} disabled={withdrawing}
                  style={{width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: '#FF5252', cursor: withdrawing ? 'default' : 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, opacity: withdrawing ? 0.6 : 1}}>
            <Icon name="trash" size={17} color="#FF5252"/> {withdrawing ? '탈퇴 처리 중...' : '탈퇴하기'}
          </button>

          <div style={{textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 20}}>Todi Study Planner</div>

          <button onClick={onClose}
                  style={{width: '100%', marginTop: 18, padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: C.muted, cursor: 'pointer'}}>닫기</button>
        </div>
      </div>
      </>
  );
}

// 루틴(반복 일정)으로 표시된 할 일을 날짜 상관없이 한 눈에 모아보는 모달.
// 체크박스는 "오늘" 완료했는지를 보여주고 토글함 (루틴은 날짜별로 완료 여부가 따로 저장되니까)
// 루틴 할 일 삭제할 때 "이 날짜만" vs "전체(모든 날짜)" 고르는 모달
function DeleteRoutineChoiceModal({ title, dateLabel, onDeleteOccurrence, onDeleteAll, onCancel }) {
  return (
      <div onClick={onCancel} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 480, background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 28px', boxSizing: 'border-box'}}>
          <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4}}><Icon name="trash" size={15} color={C.muted}/> 할 일 삭제</div>
          <div style={{fontSize: 13, color: C.muted, marginBottom: 18}}>"{title}"은(는) 루틴 할 일이에요. 어떻게 지울까요?</div>

          <button onClick={onDeleteOccurrence}
                  style={{width: '100%', padding: 14, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer', marginBottom: 8, textAlign: 'left'}}>
            {dateLabel} 날짜만 삭제
            <div style={{fontSize: 11, fontWeight: 400, color: C.muted, marginTop: 2}}>다른 날짜엔 계속 반복해서 떠요</div>
          </button>

          <button onClick={onDeleteAll}
                  style={{width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#FFEAEA', fontSize: 14, fontWeight: 700, color: '#FF5252', cursor: 'pointer', marginBottom: 8, textAlign: 'left'}}>
            전체 삭제 (모든 날짜)
            <div style={{fontSize: 11, fontWeight: 400, color: '#FF5252', opacity: 0.8, marginTop: 2}}>이 루틴 자체가 없어져요. 되돌릴 수 없어요</div>
          </button>

          <button onClick={onCancel}
                  style={{width: '100%', padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: C.muted, cursor: 'pointer'}}>취소</button>
        </div>
      </div>
  );
}


// 루틴 할 일 수정할 때 "이 날짜만" vs "전체(모든 날짜)" 고르는 모달.
// "이 날짜만"을 고르면 원본 루틴은 안 바뀌고, 그 날짜만 일반 할 일로 떨어져 나와서 수정된 내용으로 저장됨
function EditRoutineChoiceModal({ title, dateLabel, onEditOccurrence, onEditAll, onCancel }) {
  return (
      <div onClick={onCancel} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 480, background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 28px', boxSizing: 'border-box'}}>
          <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4}}><Icon name="paw" size={15} color={C.muted}/> 할 일 수정</div>
          <div style={{fontSize: 13, color: C.muted, marginBottom: 18}}>"{title}"은(는) 루틴 할 일이에요. 어떻게 수정할까요?</div>

          <button onClick={onEditOccurrence}
                  style={{width: '100%', padding: 14, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer', marginBottom: 8, textAlign: 'left'}}>
            {dateLabel} 날짜만 수정
            <div style={{fontSize: 11, fontWeight: 400, color: C.muted, marginTop: 2}}>다른 날짜 루틴은 그대로 유지돼요</div>
          </button>

          <button onClick={onEditAll}
                  style={{width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#FFEAEA', fontSize: 14, fontWeight: 700, color: '#FF5252', cursor: 'pointer', marginBottom: 8, textAlign: 'left'}}>
            전체 수정 (모든 날짜)
            <div style={{fontSize: 11, fontWeight: 400, color: '#FF5252', opacity: 0.8, marginTop: 2}}>이 루틴 자체가 바뀌어요. 반복되는 모든 날짜에 적용돼요</div>
          </button>

          <button onClick={onCancel}
                  style={{width: '100%', padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: C.muted, cursor: 'pointer'}}>취소</button>
        </div>
      </div>
  );
}

function RoutineManager({ onClose }) {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayStr = getLocalDateStr();

  const fetchRoutines = async () => {
    try {
      const [routinesRes, completionsRes] = await Promise.all([
        axios.get(`${API}/todos/routines`),
        axios.get(`${API}/todos/routine-completions`),
      ]);
      const doneTodaySet = new Set(
          completionsRes.data.filter(c => c.date === todayStr).map(c => c.todoId)
      );
      setRoutines(routinesRes.data.map(t => ({...t, completed: doneTodaySet.has(t.id)})));
    } catch (err) {
      console.error('Failed to fetch routines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutines(); }, []);

  const toggle = async (id) => {
    try {
      await axios.patch(`${API}/todos/${id}/complete`, null, { params: { date: todayStr } });
      fetchRoutines();
    } catch (err) {
      console.error('Failed to toggle routine:', err);
    }
  };

  // 여기(루틴 모아보기)엔 따로 "선택한 날짜"가 없어서, "이 날짜만 삭제"는 오늘 기준으로 처리함
  // (체크도 오늘 기준으로 되니까 통일감 있게)
  const [deleteChoice, setDeleteChoice] = useState(null);   // {id, title}

  const remove = (todo) => {
    if (!todo || typeof todo !== 'object') return;
    setDeleteChoice({ id: todo.id, title: todo.title });
  };

  const deleteToday = async () => {
    if (!deleteChoice) return;
    try {
      await axios.delete(`${API}/todos/${deleteChoice.id}`, { params: { date: todayStr } });
      fetchRoutines();
    } catch (err) {
      console.error('Failed to delete routine occurrence:', err);
    } finally {
      setDeleteChoice(null);
    }
  };

  const deleteAll = async () => {
    if (!deleteChoice) return;
    try {
      await axios.delete(`${API}/todos/${deleteChoice.id}`);
      fetchRoutines();
    } catch (err) {
      console.error('Failed to delete routine:', err);
    } finally {
      setDeleteChoice(null);
    }
  };

  return (
      <div onClick={onClose} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 32px', boxSizing: 'border-box'}}>
          <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: C.pink, marginBottom: 2}}><Icon name="repeat" size={16}/> 루틴 모아보기</div>
          <div style={{fontSize: 11, color: C.muted, marginBottom: 12}}>체크는 오늘 기준으로 처리돼요</div>

          {loading && <div style={{textAlign: 'center', padding: 20, color: C.muted}}>불러오는 중...</div>}

          {!loading && routines.length === 0 && (
              <div style={{textAlign: 'center', padding: 30, color: C.muted}}>
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: 8, opacity: 0.5}}><Icon name="repeat" size={32} color={C.muted}/></div>
                <div>아직 루틴으로 표시한 할 일이 없어요</div>
                <div style={{fontSize: 11, marginTop: 4}}>할 일 추가할 때 "루틴으로 표시"를 체크해 보세요</div>
              </div>
          )}

          {routines.map(todo => (
              <TodoCard key={todo.id} todo={todo} onToggle={toggle} onDelete={remove}/>
          ))}

          {deleteChoice && (
              <DeleteRoutineChoiceModal
                  title={deleteChoice.title}
                  dateLabel="오늘"
                  onDeleteOccurrence={deleteToday}
                  onDeleteAll={deleteAll}
                  onCancel={() => setDeleteChoice(null)}/>
          )}

          <button onClick={onClose}
                  style={{width: '100%', marginTop: 18, padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: C.muted, cursor: 'pointer'}}>닫기</button>
        </div>
      </div>
  );
}

// 카테고리 추가 / 이름·색상 변경 / 삭제 모달
function CategoryManager({ categories, onClose, onChanged }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState('');

  // 요청 성공하면 목록 새로고침, 실패하면 서버가 준 에러 메시지 표시
  const run = async (request) => {
    try {
      await request();
      setError('');
      onChanged();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  };

  const add = async () => {
    if (!newName.trim()) return;
    const ok = await run(() => axios.post(`${API}/categories`, { name: newName.trim(), color: newColor }));
    if (ok) setNewName('');
  };

  const save = (id, name, color) =>
      run(() => axios.put(`${API}/categories/${id}`, { name: name.trim(), color }));

  const remove = (id) => {
    if (!window.confirm('이 카테고리를 삭제할까요?\n안의 할 일은 삭제되지 않고 "미분류"로 이동해요.')) return;
    run(() => axios.delete(`${API}/categories/${id}`));
  };

  return (
      <div onClick={onClose} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 32px', boxSizing: 'border-box'}}>
          <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: C.pink, marginBottom: 14}}><Icon name="palette" size={16}/> 카테고리 관리</div>

          <div style={{fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8}}>새 카테고리</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10}}>
            {CATEGORY_COLORS.map(col => (
                <button key={col} onClick={() => setNewColor(col)}
                        style={{width: 26, height: 26, borderRadius: 13, background: col, cursor: 'pointer', border: newColor === col ? `3px solid ${C.text}` : '3px solid transparent'}}/>
            ))}
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                   style={{width: 30, height: 30, borderRadius: 8, overflow: 'hidden', border: 'none', padding: 0, background: 'none', cursor: 'pointer'}}/>
          </div>
          <div style={{display: 'flex', gap: 8}}>
            <input placeholder="카테고리 이름" value={newName} maxLength={30}
                   onChange={e => setNewName(e.target.value)}
                   style={{...inp, marginBottom: 0, flex: 1, width: 'auto', minWidth: 0}}/>
            <button onClick={add}
                    style={{padding: '0 18px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontWeight: 700, cursor: 'pointer'}}>추가</button>
          </div>

          {error && <div style={{display: 'flex', alignItems: 'center', gap: 4, color: '#FF5252', fontSize: 12, marginTop: 10}}><Icon name="alert" size={12} color="#FF5252"/> {error}</div>}

          <div style={{borderTop: `1px solid ${C.border}`, margin: '16px 0 12px'}}/>

          {categories.length === 0 && (
              <div style={{fontSize: 13, color: C.muted, marginBottom: 12}}>아직 카테고리가 없어요. 위에서 만들어 보세요!</div>
          )}
          {categories.map(c => (
              <CategoryRow key={`${c.id}-${c.name}-${c.color}`} category={c} onSave={save} onRemove={remove}/>
          ))}

          <button onClick={onClose}
                  style={{width: '100%', marginTop: 18, padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: C.muted, cursor: 'pointer'}}>닫기</button>
        </div>
      </div>
  );
}

// 카테고리 한 줄: 색상 선택 + 이름 수정 + 저장 + 삭제
function CategoryRow({ category, onSave, onRemove }) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const changed = name !== category.name || color.toLowerCase() !== category.color.toLowerCase();

  return (
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
               style={{width: 36, height: 36, borderRadius: 9, overflow: 'hidden', border: 'none', padding: 0, background: 'none', cursor: 'pointer', flexShrink: 0}}/>
        <input value={name} maxLength={30} onChange={e => setName(e.target.value)}
               style={{...inp, marginBottom: 0, flex: 1, width: 'auto', minWidth: 0}}/>
        <button disabled={!changed} onClick={() => onSave(category.id, name, color)}
                style={{padding: '8px 12px', borderRadius: 10, border: 'none', background: changed ? C.pinkDark : C.border, color: changed ? 'white' : C.muted, fontSize: 12, fontWeight: 700, cursor: changed ? 'pointer' : 'default'}}>저장</button>
        <button onClick={() => onRemove(category.id)}
                style={{background: 'none', border: 'none', color: C.muted, cursor: 'pointer', opacity: 0.6, display: 'flex'}}><Icon name="trash" size={16}/></button>
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
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });
  const panRef = useRef({ active: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

  const touchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const clampZoom = (z) => Math.max(1, Math.min(4, z));

  const handleImageTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchRef.current = { active: true, startDist: touchDist(e.touches), startZoom: zoomScale };
      panRef.current.active = false;
    } else if (e.touches.length === 1 && zoomScale > 1) {
      panRef.current = {
        active: true,
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        startOffsetX: panOffset.x, startOffsetY: panOffset.y
      };
    }
  };

  const handleImageTouchMove = (e) => {
    if (e.touches.length === 2 && pinchRef.current.active) {
      e.preventDefault();
      const newDist = touchDist(e.touches);
      const ratio = newDist / (pinchRef.current.startDist || newDist);
      setZoomScale(clampZoom(pinchRef.current.startZoom * ratio));
    } else if (e.touches.length === 1 && panRef.current.active) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panRef.current.startX;
      const dy = e.touches[0].clientY - panRef.current.startY;
      setPanOffset({ x: panRef.current.startOffsetX + dx, y: panRef.current.startOffsetY + dy });
    }
  };

  const handleImageTouchEnd = (e) => {
    if (e.touches.length < 2) pinchRef.current.active = false;
    if (e.touches.length < 1) panRef.current.active = false;
    if (zoomScale <= 1) setPanOffset({ x: 0, y: 0 });
  };

  const handleImageWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomScale(z => {
      const next = clampZoom(z + delta);
      if (next <= 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  // 브라우저가 터치/휠 리스너를 기본 passive로 붙이면 preventDefault가 무시되고 콘솔 경고가 뜨므로,
  // 라이트박스 이미지에는 passive:false 네이티브 리스너를 직접 달아준다.
  const lightboxImgRef = useRef(null);
  useEffect(() => {
    const el = lightboxImgRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleImageTouchStart, { passive: false });
    el.addEventListener('touchmove', handleImageTouchMove, { passive: false });
    el.addEventListener('touchend', handleImageTouchEnd, { passive: false });
    el.addEventListener('wheel', handleImageWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', handleImageTouchStart);
      el.removeEventListener('touchmove', handleImageTouchMove);
      el.removeEventListener('touchend', handleImageTouchEnd);
      el.removeEventListener('wheel', handleImageWheel);
    };
  }, [previewUrl, zoomScale, panOffset]);

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
    // 브라우저 로컬 이미지는 서버를 거치지 않으니 그대로
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    let fullUrl;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      fullUrl = url;
    } else {
      const baseUrl = API.replace('/api', '');
      fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }
    // <img src>는 헤더를 못 보내서, 서버 이미지 주소에는 닉네임을 쿼리로 붙임
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}nickname=${encodeURIComponent(getNickname())}`;
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
    setPanOffset({ x: 0, y: 0 });
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
            <Icon name="camera" size={15}/> 사진 추가
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
                            setPanOffset({ x: 0, y: 0 });
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
                      ref={lightboxImgRef}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (zoomScale > 1) { setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }
                        else setZoomScale(2);
                      }}
                      style={{
                        maxHeight: '80vh', maxWidth: '90vw', borderRadius: 16,
                        objectFit: 'contain',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                        transition: pinchRef.current.active || panRef.current.active ? 'none' : 'transform 0.2s ease',
                        touchAction: 'none',
                        cursor: zoomScale > 1 ? 'grab' : 'zoom-in',
                        userSelect: 'none'
                      }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 14, fontWeight: 500 }}>
                    <Icon name="search" size={12} color="rgba(255,255,255,0.7)"/> 두 손가락으로 벌려서 확대/축소 • 확대 후 드래그로 이동 • 바깥을 누르면 닫힙니다
                  </div>
                </div>
              </div>
          )}
        </div>
    );
  }

  return (
      <div style={{paddingTop: 8}}>
        <div style={{position: 'relative', marginBottom: 12}}>
          <div style={{position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none'}}><Icon name="search" size={15}/></div>
          <input placeholder="메모 검색" value={search} onChange={e => setSearch(e.target.value)}
                 style={{...inp, paddingLeft: 36}}/>
        </div>
        <button onClick={openNew} style={{width: '100%', padding: 14, borderRadius: 14, border: `2px dashed ${C.border}`, background: 'transparent', color: C.pink, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16}}>
          + 새 메모 작성
        </button>
        {filtered.length === 0 && (
            <div style={{textAlign: 'center', padding: 30, color: C.muted}}>
              <div style={{marginBottom: 8, display: 'flex', justifyContent: 'center'}}>
                <Icon name={search ? 'search' : 'note'} size={36} color={C.pink} strokeWidth={1.5}/>
              </div>
              <div>{search ? '검색 결과가 없어요' : '메모가 없어요!'}</div>
            </div>
        )}
        {filtered.map(memo => (
            <div key={memo.id} onClick={() => openEdit(memo)} style={{background: C.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, cursor: 'pointer', position: 'relative'}}>
              <div style={{fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6}}>{memo.title}</div>
              {memo.content && <div style={{fontSize: 13, color: C.muted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{memo.content}</div>}
              <div style={{fontSize: 11, color: C.muted, marginTop: 8}}>{formatDate(memo.updatedAt)}</div>
              <button onClick={e => { e.stopPropagation(); deleteMemo(memo.id); }}
                      style={{position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', opacity: 0.5, display: 'flex'}}><Icon name="trash" size={14}/></button>
            </div>
        ))}
      </div>
  );
}

// 대한민국 법정공휴일 (대체공휴일 포함, 2025~2027년) - "MM-DD" 단위가 아니라 연도별로 정확히 관리
const HOLIDAYS_KR = {
  // 2025
  '2025-01-01': '신정', '2025-01-28': '설날연휴', '2025-01-29': '설날', '2025-01-30': '설날연휴',
  '2025-03-01': '삼일절', '2025-03-03': '대체공휴일', '2025-05-05': '어린이날·부처님오신날',
  '2025-05-06': '대체공휴일', '2025-06-06': '현충일', '2025-08-15': '광복절', '2025-10-03': '개천절',
  '2025-10-05': '추석연휴', '2025-10-06': '추석', '2025-10-07': '추석연휴', '2025-10-08': '대체공휴일',
  '2025-10-09': '한글날', '2025-12-25': '크리스마스',
  // 2026
  '2026-01-01': '신정', '2026-02-16': '설날연휴', '2026-02-17': '설날', '2026-02-18': '설날연휴',
  '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', '2026-05-08': '부처님오신날',
  '2026-06-06': '현충일', '2026-08-15': '광복절', '2026-08-17': '대체공휴일', '2026-09-24': '추석연휴',
  '2026-09-25': '추석', '2026-09-26': '추석연휴', '2026-09-27': '추석연휴', '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '크리스마스',
  // 2027
  '2027-01-01': '신정', '2027-02-06': '설날연휴', '2027-02-07': '설날', '2027-02-08': '설날연휴',
  '2027-02-09': '대체공휴일', '2027-03-01': '삼일절', '2027-05-05': '어린이날', '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일', '2027-08-15': '광복절', '2027-08-16': '대체공휴일', '2027-09-14': '추석연휴',
  '2027-09-15': '추석', '2027-09-16': '추석연휴', '2027-10-03': '개천절', '2027-10-04': '대체공휴일',
  '2027-10-09': '한글날', '2027-10-11': '대체공휴일', '2027-12-25': '크리스마스', '2027-12-27': '대체공휴일',
};
const HOLIDAY_RED = '#FF5252';
const SATURDAY_BLUE = '#4C7EFF';

function CalendarView({ selectedDate, onSelect, todos, exclusions }) {
  const [current, setCurrent] = useState(new Date());
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getLocalDateStr();

  const hasTodo = (day) => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return todos.some(t =>
        (!t.isRoutine && t.dueDate === d) ||
        (t.isRoutine && t.dueDate <= d && !(exclusions || []).some(e => e.todoId === t.id && e.date === d))
    );
  };

  // 기간(dueDate~endDate)으로 설정된 할 일 중, 그 날짜를 포함하는 것 전부 (여러 개면 위로 쌓아서 표시)
  const getRangeTodos = (day) => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return todos.filter(t => !t.isRoutine && t.endDate && t.dueDate <= d && d <= t.endDate)
        .sort((a, b) => a.id - b.id);
  };
  // 이 달에서 기간 막대가 가장 많이 겹치는 날의 개수 (모든 날짜 칸 높이를 똑같이 맞추기 위해)
  const maxRangeStack = Array(daysInMonth).fill(null)
      .reduce((max, _, i) => Math.max(max, getRangeTodos(i + 1).length), 0);

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
          {['일','월','화','수','목','금','토'].map((d, idx) => (
              <div key={d} style={{fontSize: 10, color: idx === 0 ? HOLIDAY_RED : idx === 6 ? SATURDAY_BLUE : C.muted, padding: '4px 0', fontWeight: idx === 0 || idx === 6 ? 700 : 400}}>{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasT = hasTodo(day);
            const rangeTodos = getRangeTodos(day);
            const dow = (firstDay + i) % 7;
            const holidayName = HOLIDAYS_KR[dateStr];
            const isHoliday = Boolean(holidayName) || dow === 0;
            const isSaturday = dow === 6;
            const dayColor = isSelected ? 'white' : isToday ? C.pinkDark : isHoliday ? HOLIDAY_RED : isSaturday ? SATURDAY_BLUE : C.text;
            return (
                <button key={day} onClick={() => selectDay(day)} style={{
                  padding: '6px 2px', borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                  background: isSelected ? `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})` : isToday ? '#FFE4F0' : 'transparent',
                  color: dayColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 1,
                  fontSize: 13, fontWeight: isToday || isSelected || isHoliday || isSaturday ? 700 : 400,
                  minHeight: (holidayName ? 44 : 28) + maxRangeStack * 6
                }}>
                  <span style={{position: 'relative', zIndex: 1}}>{day}</span>
                  {holidayName && (
                      <span style={{position: 'relative', zIndex: 1, fontSize: 8, fontWeight: 600, lineHeight: 1.1, color: isSelected ? 'rgba(255,255,255,0.9)' : HOLIDAY_RED, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {holidayName}
                      </span>
                  )}
                  {rangeTodos.length > 0 ? (
                      rangeTodos.map((rangeTodo, idx) => (
                          // 양 끝(시작일/종료일)이 아니면 칸 사이 간격(그리드 gap)까지 막대를 늘려서 끊김 없이 이어 보이게 함
                          <div key={rangeTodo.id} style={{
                            position: 'absolute', bottom: 3 + idx * 6, height: 4, zIndex: 0,
                            left: rangeTodo.dueDate === dateStr ? 4 : -4,
                            right: rangeTodo.endDate === dateStr ? 4 : -4,
                            background: isSelected ? 'rgba(255,255,255,0.9)' : (rangeTodo.categoryColor || C.pink),
                            borderTopLeftRadius: rangeTodo.dueDate === dateStr ? 2 : 0,
                            borderBottomLeftRadius: rangeTodo.dueDate === dateStr ? 2 : 0,
                            borderTopRightRadius: rangeTodo.endDate === dateStr ? 2 : 0,
                            borderBottomRightRadius: rangeTodo.endDate === dateStr ? 2 : 0,
                          }}/>
                      ))
                  ) : (hasT && <div style={{position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: isSelected ? 'white' : C.pink}}/>)}
                </button>
            );
          })}
        </div>
      </div>
  );
}

// 공부 시간 통계 (일별/주별/월별)
function TimerStatsModal({ onClose }) {
  const [range, setRange] = useState('day'); // 'day' | 'week' | 'month'
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLabel, setTotalLabel] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  const fmtH = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
    if (m > 0) return s > 0 ? `${m}분 ${s}초` : `${m}분`;
    return `${s}초`;
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  const toStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const today = new Date();
        let start, end, buckets, keyOf;

        if (range === 'day') {
          end = new Date(today);
          start = new Date(today);
          start.setDate(start.getDate() - 6);
          buckets = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            buckets.push({ key: toStr(d), label: `${d.getMonth() + 1}/${d.getDate()}`, seconds: 0 });
          }
          keyOf = (dateStr) => dateStr;
        } else if (range === 'week') {
          end = new Date(today);
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 7 * 5);
          start = weekStart;
          buckets = [];
          for (let i = 0; i < 6; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i * 7);
            const key = toStr(d);
            buckets.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}주`, seconds: 0, weekStartDate: d });
          }
          keyOf = (dateStr) => {
            const dt = new Date(dateStr + 'T00:00:00');
            let best = buckets[0].key;
            for (const b of buckets) {
              if (b.weekStartDate <= dt) best = b.key;
            }
            return best;
          };
        } else {
          end = new Date(today);
          start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
          buckets = [];
          for (let i = 0; i < 6; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
            const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
            buckets.push({ key, label: `${d.getMonth() + 1}월`, seconds: 0 });
          }
          keyOf = (dateStr) => dateStr.slice(0, 7);
        }

        const res = await axios.get(`${API}/timer/stats/range`, {
          params: { start: toStr(start), end: toStr(end), _: Date.now() }, // 캐시 방지: 항상 최신 데이터를 받아오도록
          headers: { 'Cache-Control': 'no-cache' }
        });

        const byKey = {};
        buckets.forEach(b => { byKey[b.key] = b; });

        (res.data || []).forEach(row => {
          const k = keyOf(row.date);
          if (byKey[k]) byKey[k].seconds += row.totalSeconds || 0;
        });

        if (!cancelled) {
          setBars(buckets);
          const total = buckets.reduce((sum, b) => sum + b.seconds, 0);
          setTotalLabel(fmtH(total));
        }
      } catch (err) {
        console.error('Failed to fetch timer stats:', err);
        if (!cancelled) { setBars([]); setTotalLabel('0분'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [range, refreshTick]);

  const maxSeconds = Math.max(1, ...bars.map(b => b.seconds));

  return (
      <div onClick={onClose} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', background: C.white, borderRadius: '24px 24px 0 0', padding: '16px 24px 32px', boxSizing: 'border-box'}}>
          <div style={{width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px'}}/>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: C.pink}}><Icon name="chart" size={16}/> 공부 시간 통계</div>
            <button onClick={() => setRefreshTick(t => t + 1)} disabled={loading}
                    style={{background: 'none', border: 'none', color: C.pinkDark, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.4 : 0.85, display: 'flex'}}
                    title="새로고침"><Icon name="repeat" size={16}/></button>
          </div>

          <div style={{display: 'flex', gap: 6, marginBottom: 18}}>
            {[['day', '일별'], ['week', '주별'], ['month', '월별']].map(([key, label]) => (
                <button key={key} onClick={() => setRange(key)}
                        style={{flex: 1, padding: '9px 0', borderRadius: 12, border: `1px solid ${range === key ? C.pinkDark : C.border}`, background: range === key ? C.pinkDark : 'white', color: range === key ? 'white' : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer'}}>
                  {label}
                </button>
            ))}
          </div>

          {loading && <div style={{textAlign: 'center', padding: 30, color: C.muted}}>불러오는 중...</div>}

          {!loading && (
              <>
                <div style={{textAlign: 'center', marginBottom: 20}}>
                  <div style={{fontSize: 11, color: C.muted, marginBottom: 4}}>
                    {range === 'day' ? '최근 7일' : range === 'week' ? '최근 6주' : '최근 6개월'} 총 집중 시간
                  </div>
                  <div style={{fontSize: 22, fontWeight: 800, color: C.pinkDark}}>{totalLabel}</div>
                </div>

                <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, padding: '0 4px', marginBottom: 10}}>
                  {bars.map((b) => (
                      <div key={b.key} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end'}}>
                        <div style={{fontSize: 10, color: C.muted, fontWeight: 600}}>{b.seconds > 0 ? fmtH(b.seconds) : ''}</div>
                        <div style={{width: '100%', maxWidth: 34, height: `${Math.max(4, (b.seconds / maxSeconds) * 100)}px`, borderRadius: 8, background: b.seconds > 0 ? `linear-gradient(180deg, ${C.pinkLight}, ${C.pinkDark})` : C.border, transition: 'height 0.3s'}}/>
                        <div style={{fontSize: 10, color: C.muted}}>{b.label}</div>
                      </div>
                  ))}
                </div>

                {bars.every(b => b.seconds === 0) && (
                    <div style={{textAlign: 'center', padding: 10, color: C.muted, fontSize: 12}}>
                      아직 기록된 공부 시간이 없어요
                    </div>
                )}
              </>
          )}

          <button onClick={onClose}
                  style={{width: '100%', marginTop: 18, padding: 13, borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', fontSize: 14, color: C.muted, cursor: 'pointer'}}>닫기</button>
        </div>
      </div>
  );
}

const TIMER_SESSION_KEY = 'todi_timer_session';

function TimerTab() {
  const [subject, setSubject] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState('focus');
  const [timerId, setTimerId] = useState(null);
  const [records, setRecords] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // 진행 중인 타이머를 시작 시각 기준으로 다시 계산 (백그라운드에 있다 돌아와도 정확한 경과 시간 표시)
  const syncSeconds = () => {
    if (startTimeRef.current) {
      setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  };

  // 앱을 새로고침하거나 백그라운드에서 돌아왔을 때, 진행 중이던 타이머를 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMER_SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        setSubject(session.subject || '');
        setMode(session.mode || 'focus');
        setTimerId(session.timerId || null);
        startTimeRef.current = session.startTime;
        setSeconds(Math.floor((Date.now() - session.startTime) / 1000));
        setRunning(true);
        intervalRef.current = setInterval(syncSeconds, 1000);
      }
    } catch (err) {
      console.error('Failed to restore timer session:', err);
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncSeconds();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', syncSeconds);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', syncSeconds);
      clearInterval(intervalRef.current);
    };
  }, []);

  // subj/m을 명시적으로 받아서 시작 (state 업데이트를 기다리지 않고 바로 시작할 수 있도록 - 기록 다시 재생 기능에 사용)
  const startWith = async (subj, m) => {
    if (!subj.trim() || running) return;
    try {
      const res = await axios.post(`${API}/timer/start`, { subject: subj, mode: m === 'focus' ? 'FOCUS' : 'BREAK' });
      const now = Date.now();
      setSubject(subj);
      setMode(m);
      setTimerId(res.data.id);
      setRunning(true);
      setSeconds(0);
      startTimeRef.current = now;
      localStorage.setItem(TIMER_SESSION_KEY, JSON.stringify({ subject: subj, mode: m, timerId: res.data.id, startTime: now }));
      intervalRef.current = setInterval(syncSeconds, 1000);
    } catch (err) {
      console.error('Failed to start timer:', err);
    }
  };

  const start = () => startWith(subject, mode);

  // 지난 기록과 같은 과목/모드로 타이머 바로 다시 시작
  const replay = (r) => startWith(r.subject, r.mode);

  const stop = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    const endTime = new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
    const duration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : seconds;
    try {
      // 화면에 표시된 시간(duration)을 그대로 보내서 통계에도 똑같이 반영되게 함
      if (timerId) await axios.patch(`${API}/timer/${timerId}/stop`, { duration });
    } catch (err) {
      console.error('Failed to stop timer:', err);
    }
    localStorage.removeItem(TIMER_SESSION_KEY);
    // 같은 과목/모드 기록이 이미 있으면 새로 쌓지 않고 하나로 합침 (다시 재생 후 종료 시)
    // ids: 이 화면 한 줄이 실제로는 여러 개의 서버 기록(다시 재생해서 이어붙인 것)을 가리킬 수 있어서, 삭제할 때 전부 같이 지우기 위해 모아둠
    setRecords(prev => {
      const idx = prev.findIndex(r => r.subject === subject && r.mode === mode);
      if (idx !== -1) {
        const merged = { ...prev[idx], duration: prev[idx].duration + duration, endTime, ids: [...prev[idx].ids, timerId] };
        return [merged, ...prev.filter((_, i) => i !== idx)];
      }
      return [{subject, duration, endTime, mode, ids: [timerId]}, ...prev];
    });
    setSeconds(0);
    setTimerId(null);
    startTimeRef.current = null;
  };

  const switchMode = (m) => {
    if (running) return;
    setMode(m);
    setSeconds(0);
  };

  // 화면 목록에서만 지우면 통계(서버 합계)에는 계속 남아있으므로, 실제로 서버 기록도 같이 삭제
  const deleteRecord = async (i) => {
    const target = records[i];
    try {
      await Promise.all((target.ids || []).map(id => axios.delete(`${API}/timer/${id}`)));
    } catch (err) {
      console.error('Failed to delete study record:', err);
    }
    setRecords(prev => prev.filter((_, idx) => idx !== i));
  };

  const clearAllRecords = async () => {
    try {
      await Promise.all(records.flatMap(r => (r.ids || []).map(id => axios.delete(`${API}/timer/${id}`))));
    } catch (err) {
      console.error('Failed to delete study records:', err);
    }
    setRecords([]);
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
          {[['focus','target','집중'], ['break','coffee','휴식']].map(([m, icon, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 20, border: 'none', background: mode === m ? `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})` : C.border, color: mode === m ? 'white' : C.muted, fontWeight: mode === m ? 700 : 400, cursor: running ? 'not-allowed' : 'pointer', opacity: running && mode !== m ? 0.4 : 1}}>
                <Icon name={icon} size={15}/> {label}
              </button>
          ))}
        </div>

        <div style={{textAlign: 'center', background: C.card, borderRadius: 24, padding: '32px 20px', marginBottom: 16, border: `1px solid ${C.border}`}}>
          <div style={{fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 2}}>{mode === 'focus' ? '집중 시간' : '휴식 시간'}</div>
          <div style={{fontSize: 56, fontWeight: 800, letterSpacing: 4, background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8}}>
            {hh > 0 && `${String(hh).padStart(2,'0')}:`}{mm}:{ss}
          </div>
          {subject && <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 13, color: C.muted}}><Icon name="book" size={13}/> {subject}</div>}
        </div>

        <input placeholder="무슨 과목 공부할까요?" value={subject} onChange={e => setSubject(e.target.value)}
               disabled={running} style={{...inp, opacity: running ? 0.5 : 1}}/>

        <button onClick={running ? stop : start} style={{width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: running ? '#FF5252' : `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px rgba(255,92,138,0.3)`, marginBottom: 20}}>
          {running ? '⏹ 공부 종료' : '▶ 공부 시작'}
        </button>

        <button onClick={() => setShowStats(true)}
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '11px 0', borderRadius: 14, border: `1px solid ${C.border}`, background: 'white', color: C.pinkDark, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20}}>
          <Icon name="chart" size={15}/> 공부 시간 통계
        </button>

        {showStats && <TimerStatsModal onClose={() => setShowStats(false)}/>}

        {records.length > 0 && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, fontWeight: 600}}><Icon name="note" size={12}/> 오늘 공부 기록</div>
                <button onClick={clearAllRecords} style={{background: 'none', border: 'none', fontSize: 11, color: C.muted, cursor: 'pointer'}}>전체 삭제</button>
              </div>
              {records.map((r, i) => (
                  <div key={i} style={{background: C.card, borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: C.text}}><Icon name={r.mode === 'focus' ? 'target' : 'coffee'} size={13}/> {r.subject}</div>
                      <div style={{fontSize: 11, color: C.muted, marginTop: 2}}>{formatDuration(r.duration)}</div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <div style={{fontSize: 11, color: C.muted}}>{r.endTime} 종료</div>
                      <button onClick={() => replay(r)} disabled={running}
                              style={{background: 'none', border: 'none', color: running ? C.border : C.pinkDark, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.5 : 0.85, display: 'flex'}}
                              title="같은 과목으로 다시 시작"><Icon name="play" size={14}/></button>
                      <button onClick={() => deleteRecord(i)} style={{background: 'none', border: 'none', color: C.muted, cursor: 'pointer', opacity: 0.5, display: 'flex'}}><Icon name="trash" size={14}/></button>
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
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  const kakaoClientId = process.env.REACT_APP_KAKAO_REST_KEY || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (mode === 'signup' && !nickname.trim())) {
      setError(mode === 'signup' ? '이메일, 비밀번호, 닉네임을 모두 입력해 주세요.' : '이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? `${API}/auth/login` : `${API}/auth/signup`;
      const body = mode === 'login'
          ? { email: email.trim(), password }
          : { email: email.trim(), password, nickname: nickname.trim() };
      const res = await axios.post(endpoint, body);
      onLogin(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 구글 로그인 성공 시 구글이 넘겨준 idToken(credential)을 서버로 보내서 검증받음
  const handleGoogleCredential = async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/google`, { idToken: response.credential });
      onLogin(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 구글 로그인 버튼: Google Identity Services 스크립트를 한 번만 불러와서 렌더링
  useEffect(() => {
    if (!googleClientId) return;

    const renderButton = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard', theme: 'outline', size: 'large', width: 280, text: 'continue_with', locale: 'ko',
      });
    };

    if (window.google && window.google.accounts) {
      renderButton();
      return;
    }

    const existing = document.getElementById('google-identity-script');
    if (existing) {
      existing.addEventListener('load', renderButton);
      return () => existing.removeEventListener('load', renderButton);
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  // 카카오 로그인 시작: 카카오 인증 페이지로 이동 (돌아올 때 이 페이지 주소로 다시 돌아옴)
  const startKakaoLogin = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(kakaoClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    window.location.href = url;
  };

  // 카카오 인증 페이지에서 돌아오면 주소에 ?code=... 가 붙어있음 -> 서버로 보내서 로그인 마무리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    // 새로고침해도 같은 code로 다시 요청되지 않도록 주소를 바로 정리
    window.history.replaceState({}, '', window.location.pathname);

    const redirectUri = window.location.origin + window.location.pathname;
    setLoading(true);
    axios.post(`${API}/auth/kakao`, { code, redirectUri })
        .then(res => onLogin(res.data))
        .catch(err => setError(errorMessage(err)))
        .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div style={{ fontSize: 26, fontWeight: 800, background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 24 }}>Todi</div>

          {(googleClientId || kakaoClientId) && (
              <>
                {googleClientId && <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: kakaoClientId ? 10 : 16 }}/>}
                {kakaoClientId && (
                    <button type="button" onClick={startKakaoLogin}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', maxWidth: 280, margin: '0 auto 16px', padding: '11px 0', borderRadius: 8, border: 'none', background: '#FEE500', color: '#191919', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      💬 카카오로 계속하기
                    </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 20px', color: C.muted, fontSize: 11 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }}/>
                  또는
                  <div style={{ flex: 1, height: 1, background: C.border }}/>
                </div>
              </>
          )}

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
                type="email"
                placeholder="이메일"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ ...inp, marginBottom: 12 }}
            />
            {mode === 'signup' && (
                <input
                    placeholder="닉네임 (예: 홍길동)"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    style={{ ...inp, marginBottom: 12 }}
                />
            )}
            <input
                type="password"
                placeholder={mode === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inp, marginBottom: 16 }}
            />

            {error && <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FF5252', fontSize: 12, marginBottom: 14, fontWeight: 500 }}><Icon name="alert" size={13} color="#FF5252"/> {error}</div>}

            <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: `linear-gradient(135deg, ${C.pinkDark}, ${C.lavender})`,
                  color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 16px rgba(255,92,138,0.3)'
                }}>
              {loading ? '처리 중...' : (mode === 'login' ? '로그인하기 ✨' : '가입하고 시작하기 ✨')}
            </button>
          </form>

        </div>
      </div>
  );
}

