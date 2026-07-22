import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { deleteProject, listProjects, listRecordings, saveProject, saveRecording } from '../core/storage/database';
import { exportOpenVoxProject, importOpenVoxProject } from '../core/storage/projectFile';
import { useI18n } from '../i18n/I18nContext';
import type { OpenVoxProject } from '../types';

export function ProjectsPage() {
  const { t } = useI18n();
  const { setProject, createProject } = useApp();
  const [projects, setProjects] = useState<OpenVoxProject[]>([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const refresh = () => void listProjects().then(setProjects);
  useEffect(refresh, []);

  const create = async () => {
    const project = createProject(`OpenVox Project ${new Date().toLocaleDateString()}`);
    await saveProject(project);
    refresh();
    navigate('/studio');
  };
  const exportProject = async (project: OpenVoxProject) =>
    exportOpenVoxProject(project, await listRecordings(project.id));
  const importProject = async (file: File) => {
    try {
      const data = await importOpenVoxProject(file);
      await saveProject(data.project);
      await Promise.all(data.recordings.map(saveRecording));
      setProject(data.project);
      refresh();
      setMessage(t('status.projectImported'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('projects.importFailed'));
    }
  };

  return (
    <div className="page">
      <Seo title={t('projects.title')} description={t('projects.subtitle')} path="/projects" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{t('projects.eyebrow')}</div>
          <h1>{t('projects.title')}</h1>
          <p>{t('projects.subtitle')}</p>
        </div>
        <div className="action-row">
          <button className="button button-primary" onClick={() => void create()}>
            <Icon name="plus" />
            {t('projects.new')}
          </button>
          <label className="button file-button">
            <Icon name="upload" />
            {t('projects.import')}
            <input
              type="file"
              accept=".openvox"
              onChange={(e) => e.target.files?.[0] && void importProject(e.target.files[0])}
            />
          </label>
        </div>
      </div>
      <div className="projects-grid">
        {projects.length ? (
          projects.map((project) => (
            <article className="card project-card span-4" key={project.id}>
              <h3>{project.name}</h3>
              <p>
                {new Date(project.updatedAt).toLocaleString()} · {project.score.notes.length} {t('projects.noteCount')}
              </p>
              <div className="project-actions">
                <button
                  className="button button-primary"
                  onClick={() => {
                    setProject(project);
                    navigate('/studio');
                  }}
                >
                  <Icon name="folder" />
                  {t('projects.open')}
                </button>
                <button className="button" onClick={() => void exportProject(project)}>
                  <Icon name="download" />
                  {t('projects.export')}
                </button>
                <button className="button button-danger" onClick={() => void deleteProject(project.id).then(refresh)}>
                  <Icon name="trash" />
                  {t('common.delete')}
                </button>
              </div>
            </article>
          ))
        ) : (
          <section className="card panel span-12">
            <div className="empty-state">{t('projects.none')}</div>
          </section>
        )}
      </div>
      {message && <div className="toast">{message}</div>}
    </div>
  );
}
