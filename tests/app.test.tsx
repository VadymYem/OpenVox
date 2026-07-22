import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/app/App';
import { AppProvider } from '../src/app/AppContext';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('openvox.language', 'en');
  localStorage.setItem('openvox.theme', 'system');
});

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>
  );
}

describe('OpenVox application shell', () => {
  const routes = [
    ['/', 'Your voice. Understood.'],
    ['/studio', 'Live Voice Studio'],
    ['/practice', 'Practice Studio'],
    ['/academy', 'Train the whole instrument.'],
    ['/instruments', 'Tune. Reference. Rehearse.'],
    ['/track-lab', 'Rehearse the passage, not the whole song.'],
    ['/mixer', 'Build the rehearsal. Mix the take.'],
    ['/audio-lab', 'Shape and inspect the signal.'],
    ['/progress', 'Practice that leaves a trace.'],
    ['/transcribe', 'Voice to Score'],
    ['/analyze', 'Vocal Analysis'],
    ['/score', 'Score Editor'],
    ['/choir', 'Choir Studio'],
    ['/projects', 'Local Projects'],
    ['/settings', 'Settings'],
    ['/privacy', 'Privacy'],
    ['/about', 'OpenVox Studio']
  ] as const;

  for (const [path, heading] of routes) {
    it(`renders ${path}`, async () => {
      renderRoute(path);
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
    });
  }

  it('switches the interface language without reloading', async () => {
    const user = userEvent.setup();
    renderRoute('/settings');

    await screen.findByRole('heading', { level: 1, name: 'Settings' });
    await user.click(screen.getByRole('button', { name: 'UK' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Налаштування' })).toBeTruthy();
    await waitFor(() => expect(document.documentElement.lang).toBe('uk'));
  });

  it('falls back to the landing page for unknown routes', async () => {
    renderRoute('/this-route-does-not-exist');
    expect(await screen.findByRole('heading', { level: 1, name: 'Your voice. Understood.' })).toBeTruthy();
  });
});

describe('Score editor', () => {
  it('adds a note and renders it in the score preview', async () => {
    const user = userEvent.setup();
    const { container } = renderRoute('/score');

    await screen.findByRole('heading', { level: 1, name: 'Score Editor' });
    expect(container.querySelectorAll('.note-row')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /Add note/i }));

    expect(container.querySelectorAll('.note-row')).toHaveLength(1);
    expect(container.querySelector('.score-svg-wrap svg')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(container.querySelectorAll('.note-row')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Redo' }));
    expect(container.querySelectorAll('.note-row')).toHaveLength(1);
  });
});

describe('Project support and mobile-ready score UI', () => {
  it('opens the project support modal from the floating action button', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    await screen.findByRole('heading', { level: 1, name: 'Your voice. Understood.' });
    await user.click(screen.getByRole('button', { name: 'Support project' }));
    expect(await screen.findByRole('dialog', { name: 'OpenVox helped you?' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Support AuthorChe' }).getAttribute('href')).toBe(
      'https://authorche.top/donate'
    );
    await user.click(screen.getByRole('button', { name: 'Maybe later' }));
    expect(screen.queryByRole('dialog', { name: 'OpenVox helped you?' })).toBeNull();
  });

  it('renders the public author card and résumé link on the landing page', async () => {
    renderRoute('/');
    expect(await screen.findByRole('heading', { level: 2, name: 'Created by AuthorChe' })).toBeTruthy();
    expect(
      screen
        .getAllByRole('link', { name: 'View résumé' })
        .some((link) => link.getAttribute('href') === 'https://authorche.top/resume')
    ).toBe(true);
  });

  it('provides edit and preview panes plus score zoom controls', async () => {
    renderRoute('/score');
    await screen.findByRole('heading', { level: 1, name: 'Score Editor' });
    expect(screen.getByRole('tab', { name: 'Note' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Visual score' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeTruthy();
  });
});
