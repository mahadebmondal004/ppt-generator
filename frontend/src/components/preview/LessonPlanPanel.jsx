import { useState } from 'react';

const Section = ({ icon, title, children }) => (
  <div className="lesson-section">
    <div className="lesson-section-title">{icon} {title}</div>
    <div className="lesson-section-body">{children}</div>
  </div>
);

const BulletList = ({ items }) => (
  <div className="lesson-list">
    {(items || []).map((item, i) => (
      <div key={i} className="lesson-list-item">{item}</div>
    ))}
  </div>
);

export default function LessonPlanPanel({ lessonPlan, config, inline }) {
  const [tab, setTab] = useState('plan'); // 'plan' | 'meta'

  if (!lessonPlan) {
    return (
      <div style={{ padding: 'var(--space-lg)', color: 'var(--text-muted)', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
        <p style={{ fontSize: '0.85rem' }}>Lesson plan not available</p>
      </div>
    );
  }

  if (inline) {
    // Full-page lesson plan view
    return (
      <div style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 8px' }}>Lesson Plan</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {config?.board} · {config?.grade} · {config?.subject} · {config?.topic}
          </p>
        </div>
        <LessonPlanContent lessonPlan={lessonPlan} config={config} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div className="lesson-plan-tabs">
        <button
          id="lesson-tab-plan"
          className={`lesson-plan-tab ${tab === 'plan' ? 'active' : ''}`}
          onClick={() => setTab('plan')}
        >Lesson Plan</button>
        <button
          id="lesson-tab-meta"
          className={`lesson-plan-tab ${tab === 'meta' ? 'active' : ''}`}
          onClick={() => setTab('meta')}
        >Details</button>
      </div>

      <div className="lesson-plan-content" style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'plan' ? (
          <LessonPlanContent lessonPlan={lessonPlan} config={config} />
        ) : (
          <div>
            {[
              { label: 'Board', value: config?.board },
              { label: 'Grade', value: config?.grade },
              { label: 'Subject', value: config?.subject },
              { label: 'Topic', value: config?.topic },
              { label: 'Duration', value: `${config?.classDuration} minutes` },
              { label: 'Slides', value: config?.slideCount },
              { label: 'Difficulty', value: config?.difficultyLevel },
              { label: 'Image Pref.', value: config?.imagePreference },
            ].map(item => (
              <div key={item.label} className="duration-row">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LessonPlanContent({ lessonPlan, config }) {
  return (
    <div>
      <Section icon="🎯" title="Learning Objectives">
        <BulletList items={lessonPlan.learningObjectives} />
      </Section>

      <Section icon="📚" title="Prior Knowledge">
        <p style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>{lessonPlan.priorKnowledge}</p>
      </Section>

      <Section icon="🪝" title="Introduction / Hook">
        <p style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>{lessonPlan.hook}</p>
      </Section>

      <Section icon="🧑‍🏫" title="Teaching Activities">
        <BulletList items={lessonPlan.teachingActivities} />
      </Section>

      <Section icon="✏️" title="Student Activities">
        <BulletList items={lessonPlan.studentActivities} />
      </Section>

      <Section icon="📊" title="Assessment">
        <p style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>{lessonPlan.assessment}</p>
      </Section>

      <Section icon="🗂️" title="Resources Required">
        <BulletList items={lessonPlan.resources} />
      </Section>

      <Section icon="🏠" title="Homework / Extension">
        <p style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>{lessonPlan.homework}</p>
      </Section>

      <Section icon="⏱️" title="Duration Map">
        {(lessonPlan.durationMap || []).map((item, i) => (
          <div key={i} className="duration-row">
            <span>{item.phase}</span>
            <span className="duration-minutes">{item.minutes} min</span>
          </div>
        ))}
      </Section>
    </div>
  );
}
