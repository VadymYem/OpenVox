/// <reference types="vite/client" />

interface Window {
  OpenVoxProLab?: new () => unknown;
  openOpenVoxProLab?: (tab?: string) => void;
}
