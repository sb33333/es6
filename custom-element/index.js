class CustomTable extends HTMLElement {
    
    #records = [];
    #fieldNames = null;
    
    constructor (fieldNames) {
        super();
        if (!Array.isArray(fieldNames)) throw new Error("fieldNames must be an Array");
        this.#fieldNames = fieldNames;
    }

}

class CustomTable2 extends CustomTable {
    constructor () {
        super(["custNm", "age"]);
    }

    fieldSelector = {
        custNm: (htmlElement) => htmlElement.querySelector("[name=custNm]"),
        age: (htmlElement) => htmlElement.querySelector("[name=age]")
    }
    convert () {
        
    }
}

customElements.define("custom-table", CustomTable2);