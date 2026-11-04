// ====== COMPTES CRÉÉS À LA MAIN ======
// Pour ajouter un compte : ouvre generer-compte.html, copie la ligne générée et colle-la ici.
// mustChange: true => le mot de passe temporaire doit être changé à la première connexion.
const COMPTES = [
    { user: "demo", hash: "c7eb10551d4f95991a0c0064fe45ef2b819d988f287836951a184f3f70d66ff1", mustChange: true }, // mdp temporaire : Temp1234
];
// =====================================

const Auth = {
    async hash(user, pw) {
        const data = new TextEncoder().encode(user.trim().toLowerCase() + ":" + pw);
        const buf = await crypto.subtle.digest("SHA-256", data);
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    },

    overrides() {
        try { return JSON.parse(localStorage.getItem("pw_overrides") || "{}"); }
        catch (e) { return {}; }
    },

    session() {
        try { return JSON.parse(sessionStorage.getItem("session")); }
        catch (e) { return null; }
    },

    async login(user, pw) {
        const u = user.trim().toLowerCase();
        const compte = COMPTES.find(c => c.user.toLowerCase() === u);
        const h = await this.hash(u, pw);
        const override = this.overrides()[u];
        const attendu = override || (compte && compte.hash);
        if (!compte || h !== attendu) return false;
        sessionStorage.setItem("session", JSON.stringify({
            user: compte.user,
            mustChange: !override && compte.mustChange !== false
        }));
        return true;
    },

    async changePassword(newPw) {
        const s = this.session();
        if (!s) throw new Error("Non connecté.");
        const ov = this.overrides();
        ov[s.user.toLowerCase()] = await this.hash(s.user, newPw);
        localStorage.setItem("pw_overrides", JSON.stringify(ov));
        s.mustChange = false;
        sessionStorage.setItem("session", JSON.stringify(s));
    },

    logout() { sessionStorage.removeItem("session"); },

    // À appeler en haut de chaque page protégée : Auth.require();
    require() {
        const s = this.session();
        if (!s) { location.href = "connexion.html"; return null; }
        if (s.mustChange) { location.href = "changer-mdp.html"; return null; }
        return s;
    }
};
