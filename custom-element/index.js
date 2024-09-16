const findValueFrom = function (scope, selector) {
    var input = scope.querySelector(selector);
    return input.value;
}

class CustomTable extends HTMLElement {
    
    #records = [];
    #fieldNames = null;
    _recordExtractor = null;
    _idSymbol = Symbol("id");
    _elementSymbol = Symbol("element");

    convert () {
        return this._recordExtractor(this);
    }
    
    constructor (fieldNames) {
        super();
        if (!Array.isArray(fieldNames)) throw new Error("fieldNames must be an Array");
        this.#fieldNames = fieldNames;
    }

    get records () {
        return this.#records.slice();
    }

    connectedCallback () {
        this.#records = this.convert();
    }

}

class CustomTable2 extends CustomTable {
    constructor () {
        super(["custNm", "age"]);
    }

    _recordExtractor = function (parentElement) {
        return Array.from(parentElement.querySelectorAll("tbody tr")).map(element => {
            return this._fieldExtractor(element, this._idSymbol in element);
        });
    }
    _fieldExtractor = function (recordElement, hasId) {
        var obj = {
            custNm:findValueFrom(recordElement, "[name=custNm]"),
            age:findValueFrom(recordElement, "[name=age]"),
            [this._elementSymbol]: recordElement
        }
        if (!hasId) obj[this._idSymbol] = crypto.randomUUID();

        return obj;
    }
}

customElements.define("custom-table", CustomTable2);