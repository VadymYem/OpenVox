# Security Policy

OpenVox takes security, privacy, and responsible vulnerability disclosure seriously.

OpenVox is a privacy-first, client-side audio and music application. Core audio processing is designed to run locally in the user's browser. Security reports that could affect user privacy, local data integrity, application execution, dependency safety, or the integrity of distributed builds are welcome.

## Supported Versions

Security updates are currently provided for the latest actively maintained release line.

| Version           | Supported |
| ----------------- | --------- |
| 0.9.x beta        | Yes       |
| 0.8.x and earlier | No        |

Pre-release versions may change frequently. Users are encouraged to update to the latest available release before reporting an issue that may already have been resolved.

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub Issues, Discussions, pull requests, or other public channels.**

Please report vulnerabilities privately through GitHub's security reporting system:

**Repository:** `vadymyem/OpenVox`

1. Open the OpenVox repository on GitHub.
2. Go to **Security**.
3. Select **Advisories**.
4. Select **Report a vulnerability**.
5. Include as much technical information as possible.

If private vulnerability reporting is temporarily unavailable, contact the project maintainer through the official contact methods published at:

`https://authorche.top`

Please clearly state that the message concerns an **OpenVox security vulnerability** and avoid publishing exploit details publicly.

## What to Include

A useful vulnerability report should include, when applicable:

* a clear description of the vulnerability;
* the affected OpenVox version;
* the affected browser and operating system;
* exact steps required to reproduce the issue;
* a minimal proof of concept;
* the expected behavior;
* the actual behavior;
* potential security or privacy impact;
* whether user interaction is required;
* relevant console output or error messages;
* screenshots or screen recordings when useful;
* suggested remediation, if known.

Please remove sensitive personal information, private recordings, authentication credentials, access tokens, or unrelated user data before submitting diagnostic material.

## Response Process

After receiving a valid security report, the project will make a reasonable effort to:

1. acknowledge receipt of the report;
2. reproduce and validate the reported issue;
3. evaluate severity and potential impact;
4. develop and test an appropriate fix;
5. prepare a coordinated release when necessary;
6. publish a security advisory after remediation when public disclosure is appropriate.

Response times may vary depending on severity, complexity, maintainer availability, browser-specific behavior, and the need to coordinate fixes with third-party projects.

Critical vulnerabilities affecting user privacy, arbitrary code execution, dependency integrity, or distributed release artifacts receive the highest priority.

## Security Scope

Security reports are especially welcome for issues involving:

### Client-Side Code Execution

* arbitrary JavaScript execution;
* DOM-based cross-site scripting;
* unsafe handling of imported project data;
* unsafe handling of MusicXML, MIDI, JSON, audio, or other user-provided files;
* injection vulnerabilities;
* unsafe URL handling;
* unsafe dynamic HTML generation.

### Local Data Security

* unauthorized access to IndexedDB data;
* accidental exposure of saved recordings;
* corruption of locally stored projects;
* unsafe project import or export behavior;
* cross-origin leakage of locally processed data.

### Audio and Media Security

* unexpected transmission of microphone audio;
* microphone access without clear user action or browser permission;
* unintended recording behavior;
* unsafe handling of locally imported audio files;
* privacy leaks involving generated recordings or analysis data.

### WebAssembly and AudioWorklet

* memory-safety problems affecting the WebAssembly processing module;
* malformed input causing security-relevant crashes;
* unsafe communication between the main thread and audio processing components;
* unexpected remote loading of processing code.

### Privacy

* user audio unexpectedly leaving the device;
* telemetry being enabled without user consent;
* unintended transmission of locally stored data;
* third-party network requests inconsistent with documented behavior.

### Dependencies and Supply Chain

* compromised or malicious dependencies;
* dependency confusion;
* unsafe GitHub Actions workflows;
* vulnerable build or release automation;
* tampering with GitHub Pages deployment artifacts;
* integrity problems affecting distributed builds.

### Progressive Web Application

* service worker cache poisoning;
* unsafe cache persistence;
* serving outdated security-sensitive processing code after an update;
* scope errors that affect resources outside OpenVox.

## Out of Scope

The following are generally not considered security vulnerabilities unless they result in a demonstrable security or privacy impact:

* inaccurate pitch detection;
* inaccurate note recognition;
* normal audio latency;
* browser-specific audio quality differences;
* unsupported browser features;
* cosmetic interface problems;
* accessibility problems without a security consequence;
* denial of service requiring intentionally importing extremely large files on the attacker's own device;
* issues requiring a user to modify OpenVox source code themselves;
* vulnerabilities present only in obsolete or unsupported browser versions;
* social engineering without a technical vulnerability in OpenVox;
* missing security headers on third-party hosting environments not controlled by the project;
* reports generated entirely by automated scanners without a reproducible impact.

Quality, compatibility, accessibility, and non-security bugs should be reported through the normal GitHub Issues system.

## Local-First Security Model

OpenVox is designed around local processing.

Core functionality may use browser capabilities including:

* Web Audio API;
* AudioWorklet;
* WebAssembly;
* MediaRecorder;
* IndexedDB;
* File APIs;
* Web MIDI, where supported.

These APIs operate within the browser's security model.

OpenVox does not require a dedicated application backend for its core audio processing workflow.

Microphone access must be explicitly granted by the user through the browser permission system.

Imported files are intended to be processed locally unless a feature explicitly states otherwise.

## Analytics

Analytics are **disabled by default**.

If analytics functionality is available in a particular build, it must require explicit user opt-in before the analytics provider is loaded.

Audio recordings, microphone streams, musical projects, imported media, and pitch-analysis data must not be intentionally transmitted as analytics data.

## Browser Permissions

OpenVox relies on browser-managed permissions for sensitive capabilities.

Users should only grant permissions that they intend to use.

Depending on the browser and operating system, permissions may include:

* microphone access;
* MIDI device access;
* persistent storage;
* file access initiated by the user.

The application must not attempt to bypass browser permission mechanisms.

## Imported Files

OpenVox may process untrusted user-provided files, including supported audio, project, MusicXML, MIDI, and JSON data.

Parsers should treat all imported content as untrusted.

Contributors working on import functionality should:

* validate data before use;
* avoid executing imported content;
* avoid inserting untrusted strings as raw HTML;
* apply reasonable size and complexity limits where necessary;
* fail safely when encountering malformed input.

## Dependencies

Dependencies are tracked through the repository lockfile.

The project uses automated repository security tooling where available, including:

* Dependabot;
* dependency review;
* CodeQL;
* continuous integration checks;
* dependency declaration validation;
* a CycloneDX software bill of materials.

The presence of automated tooling does not guarantee that all vulnerabilities will be detected.

## Build and Release Security

Official releases should originate from the official OpenVox repository and its documented build process.

Users downloading pre-built versions should verify that they originate from an official project distribution channel.

Security-sensitive changes to build workflows, dependencies, service workers, WebAssembly modules, and deployment configuration should receive additional review.

## GitHub Pages

The official GitHub Pages deployment is built through repository automation.

Deployment workflows should follow the principle of least privilege and request only the permissions necessary to:

* build the application;
* upload the Pages artifact;
* deploy the Pages artifact.

Pull request workflows from untrusted contributors must not receive unnecessary write credentials or deployment secrets.

## Responsible Disclosure

Security researchers are requested to allow reasonable time for investigation and remediation before publicly disclosing vulnerability details.

Please avoid:

* publicly disclosing an unpatched vulnerability;
* accessing data belonging to other users;
* intentionally degrading third-party systems;
* persistent denial-of-service activity;
* destructive testing;
* social engineering;
* physical attacks.

Testing should be limited to systems, devices, accounts, and data that you own or have explicit permission to test.

## Safe Harbor

The OpenVox project supports good-faith security research.

If you:

* act in good faith;
* make a reasonable effort to avoid privacy violations;
* avoid unnecessary disruption;
* do not intentionally damage data;
* report discovered vulnerabilities privately;
* provide the project a reasonable opportunity to remediate the issue;

the project will consider your research authorized within the scope of this policy and will not intentionally pursue legal action solely because of that good-faith security research.

This safe-harbor statement does not authorize testing against third-party infrastructure, services, accounts, or systems that the OpenVox project does not control.

## Coordinated Disclosure

When appropriate, a confirmed vulnerability may result in:

* a private security advisory;
* a patched release;
* a CVE request where applicable;
* release notes describing the security fix;
* public acknowledgment of the reporter, with their permission.

Reporter anonymity will be respected when requested.

## Security Is an Ongoing Process

No software can be guaranteed to be completely free of security vulnerabilities.

OpenVox aims to reduce risk through:

* local-first processing;
* minimal required server infrastructure;
* explicit permission boundaries;
* strict TypeScript checks;
* automated testing;
* dependency monitoring;
* static analysis;
* reproducible builds;
* documented privacy behavior;
* responsible vulnerability disclosure.

Security improvements and responsible reports are welcome.

---

Copyright © 2026 AuthorChe (Vadym Yemelianov)

OpenVox is distributed under the license included in the repository.
