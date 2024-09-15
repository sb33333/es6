const defaultName = "sanghyeok";

export function greeting(name = defaultName) {
    return "hello " + name;
}