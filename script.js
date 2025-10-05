// DARK MODE TOGGLE
const root = document.documentElement;
const saveTheme = localStorage.getItem('theme');

// Load saved or system theme preference
if (saveTheme == "dark" || (!saveTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-mode");
}


const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    let theme = "light";
    if (document.body.classList.contains("dark-mode")) {
        theme = "dark";
    }
    localStorage.setItem('theme', theme);
});
