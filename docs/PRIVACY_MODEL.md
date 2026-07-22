# Privacy model

## Data-flow summary

```text
Microphone -> browser audio graph -> local analysis -> interface
                                      |
                                      +-> optional local IndexedDB recording/session data

Imported files -> browser file APIs -> local parser/decoder -> local project state

Explicit export -> browser download -> user's device
```

There is no required OpenVox application API in this path.

## Data stored locally

Depending on usage, the site can persist:

- project metadata and score events;
- user settings;
- room noise calibration;
- saved recording blobs;
- training session summaries;
- weekly practice goals;
- custom instrument tunings;
- advanced audio-lab presets.

Storage is scoped to the site's browser origin.

## Data leaving the device

### Static hosting

The browser downloads application assets from the hosting origin, such as GitHub Pages.

### Optional analytics

The standard web deployment loads the configured Google Analytics property (`G-6LN7QL6SP2`) by default for page-visit measurement and exposes an opt-out in Settings. The application does not intentionally attach microphone frames, score documents or recording blobs to analytics events. Deployment operators remain responsible for any consent or disclosure requirements that apply to their audience.

### Optional speech recognition

Browser speech recognition is opt-in and is not guaranteed to be local because the browser vendor controls its implementation.

### User-initiated links

Opening GitHub, the AuthorChe site or the support page navigates to an external site under the user's control.

## Threat boundaries

Because OpenVox is client-side, users should consider:

- any script served by the deployment origin can access application-origin browser storage;
- browser extensions may have broad page permissions;
- exported project/audio files inherit the security of the device location where they are saved;
- shared computers should not be assumed private after local data is stored.

## Self-hosting

The code can be self-hosted. Deployers who require a stricter privacy profile can remove optional analytics entirely while retaining core functionality.
