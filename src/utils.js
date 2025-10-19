// A simple deep merge function for config objects
export function deepMerge(target, source) {
    const output = { ...target };
    if (target && source && typeof target === 'object' && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && key in target && target[key] && typeof target[key] === 'object') {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}
