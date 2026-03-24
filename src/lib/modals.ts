import { create } from 'zustand';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ModalState {
    toasts: ToastMessage[];
    confirmState: {
        isOpen: boolean;
        message: string;
        resolve: ((val: boolean) => void) | null;
    };
    promptState: {
        isOpen: boolean;
        message: string;
        value: string;
        resolve: ((val: string | null) => void) | null;
    };
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
    openConfirm: (message: string, resolve: (val: boolean) => void) => void;
    closeConfirm: (val: boolean) => void;
    openPrompt: (message: string, resolve: (val: string | null) => void) => void;
    closePrompt: (val: string | null) => void;
    setPromptValue: (val: string) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
    toasts: [],
    confirmState: { isOpen: false, message: '', resolve: null },
    promptState: { isOpen: false, message: '', value: '', resolve: null },

    addToast: (t) => {
        const id = Math.random().toString(36).substring(7);
        set(state => ({ toasts: [...state.toasts, { ...t, id }] }));
        setTimeout(() => {
            get().removeToast(id);
        }, 3000);
    },
    removeToast: (id) => set(state => ({ toasts: state.toasts.filter(x => x.id !== id) })),

    openConfirm: (message, resolve) => set({ confirmState: { isOpen: true, message, resolve } }),
    closeConfirm: (val) => {
        const resolve = get().confirmState.resolve;
        set({ confirmState: { isOpen: false, message: '', resolve: null } });
        if (resolve) resolve(val);
    },

    openPrompt: (message, resolve) => set({ promptState: { isOpen: true, message, value: '', resolve } }),
    closePrompt: (val) => {
        const resolve = get().promptState.resolve;
        set({ promptState: { isOpen: false, message: '', value: '', resolve: null } });
        if (resolve) resolve(val);
    },
    setPromptValue: (value) => set(state => ({ promptState: { ...state.promptState, value } }))
}));

// Helper functions that can be imported directly without hooks
export const toast = {
    success: (message: string) => useModalStore.getState().addToast({ message, type: 'success' }),
    error: (message: string) => useModalStore.getState().addToast({ message, type: 'error' }),
    info: (message: string) => useModalStore.getState().addToast({ message, type: 'info' }),
};

export const confirmModal = (message: string): Promise<boolean> => {
    return new Promise(resolve => {
        useModalStore.getState().openConfirm(message, resolve);
    });
};

export const promptModal = (message: string): Promise<string | null> => {
    return new Promise(resolve => {
        useModalStore.getState().openPrompt(message, resolve);
    });
};
