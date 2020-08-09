class cbClicked {
    constructor() {
        this.toString = function () {
            return JSON.stringify(this);
        };
        alert(this.toString());
    }
}
