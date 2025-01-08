import Store from 'electron-store';

// Configure the store with some defaults
const store = new Store({
    name: 'kupukupu-store', // Name of the file
    clearInvalidConfig: true, // Clear if the store file is invalid
    defaults: {} // Default values
});

export const storeHandlers = {
    'store:get': (event, key) => {
        return store.get(key);
    },

    'store:set': (event, { key, value }) => {
        store.set(key, value);
        return true;
    },

    'store:delete': (event, key) => {
        store.delete(key);
        return true;
    },

    'store:clear': () => {
        store.clear();
        return true;
    },

    'store:has': (event, key) => {
        return store.has(key);
    }
};