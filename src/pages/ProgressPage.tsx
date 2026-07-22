import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import {
  deletePracticeGoal,
  deleteTrainingSession,
  listPracticeGoals,
  listTrainingSessions,
  savePracticeGoal
} from '../core/storage/database';
import type { PracticeGoal, TrainingCategory, TrainingSessionEntry } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { proText, trainingCategoryName } from '../i18n/proTranslations';

function weekStart(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date.getTime();
}
function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return min ? `${min}m ${sec}s` : `${sec}s`;
}

export function ProgressPage() {
  const { language } = useI18n();
  const x = (key: string) => proText(language, key);
  const [sessions, setSessions] = useState<TrainingSessionEntry[]>([]);
  const [goals, setGoals] = useState<PracticeGoal[]>([]);
  const [goalTitle, setGoalTitle] = useState(() => proText(language, 'progress.weeklyDefault'));
  const [goalMinutes, setGoalMinutes] = useState(120);
  const [goalCategory, setGoalCategory] = useState<TrainingCategory | 'general'>('general');

  const reload = async () => {
    setSessions(await listTrainingSessions());
    setGoals(await listPracticeGoals());
  };
  useEffect(() => {
    void reload();
  }, []);

  const stats = useMemo(() => {
    const start = weekStart();
    const thisWeek = sessions.filter((s) => s.startedAt >= start);
    const seconds = thisWeek.reduce((sum, s) => sum + s.durationSeconds, 0);
    const scored = thisWeek.filter((s) => typeof s.accuracy === 'number');
    const accuracy = scored.length ? scored.reduce((sum, s) => sum + (s.accuracy || 0), 0) / scored.length : null;
    const total = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    const days = new Set(sessions.map((s) => new Date(s.startedAt).toDateString())).size;
    return { weekMinutes: seconds / 60, accuracy, totalMinutes: total / 60, days, thisWeek };
  }, [sessions]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { seconds: number; count: number; score: number; scored: number }>();
    sessions.forEach((session) => {
      const current = map.get(session.category) || { seconds: 0, count: 0, score: 0, scored: 0 };
      current.seconds += session.durationSeconds;
      current.count += 1;
      if (typeof session.accuracy === 'number') {
        current.score += session.accuracy;
        current.scored += 1;
      }
      map.set(session.category, current);
    });
    return [...map.entries()].sort((a, b) => b[1].seconds - a[1].seconds);
  }, [sessions]);

  const addGoal = async () => {
    const goal: PracticeGoal = {
      id: crypto.randomUUID(),
      title: goalTitle.trim() || x('progress.goalFallback'),
      category: goalCategory,
      targetMinutesPerWeek: Math.max(10, goalMinutes),
      createdAt: Date.now(),
      active: true
    };
    await savePracticeGoal(goal);
    await reload();
  };

  return (
    <div className="page">
      <Seo
        title="Progress & Practice History"
        description="Local vocal training history, weekly goals, practice minutes and accuracy trends in OpenVox Studio."
        path="/progress"
      />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{x('progress.eyebrow')}</div>
          <h1>{x('progress.title')}</h1>
          <p>{x('progress.body')}</p>
        </div>
      </div>
      <div className="progress-summary-grid">
        <section className="card metric-card">
          <span>{x('progress.thisWeek')}</span>
          <strong>{Math.round(stats.weekMinutes)} min</strong>
          <small>
            {stats.thisWeek.length} {x('progress.sessions')}
          </small>
        </section>
        <section className="card metric-card">
          <span>{x('progress.avgAccuracy')}</span>
          <strong>{stats.accuracy === null ? '—' : `${stats.accuracy.toFixed(0)}%`}</strong>
          <small>{x('progress.scored')}</small>
        </section>
        <section className="card metric-card">
          <span>{x('progress.allTime')}</span>
          <strong>{Math.round(stats.totalMinutes)} min</strong>
          <small>
            {sessions.length} {x('progress.sessions')}
          </small>
        </section>
        <section className="card metric-card">
          <span>{x('progress.activeDays')}</span>
          <strong>{stats.days}</strong>
          <small>{x('progress.localHistory')}</small>
        </section>
      </div>

      <div className="progress-grid">
        <section className="card panel span-7">
          <div className="card-title">
            <h2>{x('progress.history')}</h2>
            <span className="badge">{sessions.length}</span>
          </div>
          {sessions.length ? (
            <div className="history-table">
              <div className="history-row header">
                <span>{x('progress.date')}</span>
                <span>{x('progress.exercise')}</span>
                <span>{x('progress.time')}</span>
                <span>{x('progress.score')}</span>
                <span />
              </div>
              {sessions.slice(0, 100).map((session) => (
                <div className="history-row" key={session.id}>
                  <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                  <span>
                    <strong>{session.exerciseName}</strong>
                    <small>
                      {trainingCategoryName(language, session.category)} · {session.difficulty}
                    </small>
                  </span>
                  <span>{formatDuration(session.durationSeconds)}</span>
                  <span>{typeof session.accuracy === 'number' ? `${session.accuracy}%` : '—'}</span>
                  <button
                    className="icon-button mini-icon"
                    onClick={() => void deleteTrainingSession(session.id).then(reload)}
                    aria-label={x('progress.delete')}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">{x('progress.empty')}</div>
          )}
        </section>
        <section className="card panel span-5">
          <div className="card-title">
            <h2>{x('progress.goals')}</h2>
            <span className="badge">Local</span>
          </div>
          <div className="field">
            <label>{x('progress.goal')}</label>
            <input aria-label={x('progress.goal')} value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>{x('progress.minutesWeek')}</label>
              <input
                aria-label={x('progress.minutesWeek')}
                type="number"
                min="10"
                max="1200"
                value={goalMinutes}
                onChange={(e) => setGoalMinutes(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>{x('progress.category')}</label>
              <select
                aria-label={x('progress.category')}
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value as TrainingCategory | 'general')}
              >
                <option value="general">{x('progress.general')}</option>
                {[
                  'warmup',
                  'pitch',
                  'agility',
                  'breath',
                  'resonance',
                  'articulation',
                  'ear',
                  'rhythm',
                  'dynamics',
                  'cooldown'
                ].map((category) => (
                  <option value={category} key={category}>
                    {trainingCategoryName(language, category as TrainingCategory)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="button button-primary" onClick={() => void addGoal()}>
            <Icon name="plus" />
            {x('progress.addGoal')}
          </button>
          <div className="goal-list">
            {goals.map((goal) => {
              const relevant = stats.thisWeek.filter(
                (s) => goal.category === 'general' || s.category === goal.category
              );
              const minutes = relevant.reduce((sum, s) => sum + s.durationSeconds, 0) / 60;
              const percent = Math.min(100, (minutes / goal.targetMinutesPerWeek) * 100);
              return (
                <article key={goal.id} className="goal-item">
                  <div>
                    <strong>{goal.title}</strong>
                    <small>
                      {Math.round(minutes)} / {goal.targetMinutesPerWeek} min · {goal.category}
                    </small>
                  </div>
                  <div className="goal-progress">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <button className="mini-button" onClick={() => void deletePracticeGoal(goal.id).then(reload)}>
                    {x('progress.remove')}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="card panel span-12">
          <div className="card-title">
            <h2>{x('progress.balance')}</h2>
            <span className="badge">{x('progress.allLocal')}</span>
          </div>
          <div className="category-bars">
            {categoryStats.length ? (
              categoryStats.map(([category, data]) => {
                const max = categoryStats[0][1].seconds || 1;
                return (
                  <div className="category-bar" key={category}>
                    <span>{trainingCategoryName(language, category as TrainingCategory)}</span>
                    <div>
                      <i style={{ width: `${Math.max(2, (data.seconds / max) * 100)}%` }} />
                    </div>
                    <strong>{Math.round(data.seconds / 60)} min</strong>
                    <small>
                      {data.scored
                        ? `${Math.round(data.score / data.scored)}% ${x('progress.average')}`
                        : `${data.count} ${x('progress.sessions')}`}
                    </small>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">{x('progress.complete')}</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
