export interface EventHandler {
  element: HTMLElement;
  name: string;
  callback: (event?: EventHandler) => boolean | void;
  dispose: () => void;
}
