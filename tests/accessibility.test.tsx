import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../src/app/AppContext';
import { I18nProvider } from '../src/i18n/I18nContext';
import { App } from '../src/app/App';

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>
        <I18nProvider language="en">
          <App />
        </I18nProvider>
      </AppProvider>
    </MemoryRouter>
  );
}

afterEach(() => cleanup());

for (const route of [
  '/',
  '/studio',
  '/practice',
  '/academy',
  '/instruments',
  '/track-lab',
  '/mixer',
  '/audio-lab',
  '/progress',
  '/transcribe',
  '/analyze',
  '/score',
  '/choir',
  '/projects',
  '/settings',
  '/privacy',
  '/about'
]) {
  it(`has no serious or critical automated accessibility violations on ${route}`, async () => {
    const { container } = renderRoute(route);
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
        'landmark-unique': { enabled: false }
      }
    });
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );
    expect(
      blocking.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) }))
    ).toEqual([]);
  }, 15000);
}
