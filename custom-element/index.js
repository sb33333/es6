const findValueFrom = function (scope, selector) {
    var input = scope.querySelector(selector);
    return input?.value;
}

class CustomTable extends HTMLElement {
    
    #records = [];
    #fieldNames = null;
    _recordExtractor (customElement) {
        throw new Error("not implemented.");
    }
    _fieldExtractor (recordElement, hasId) {
        throw new Error("not implemented.");
    }
    _idSymbol = Symbol("id");
    _elementSymbol = Symbol("element");

    readFromHtml () {
        return Array.from(this._recordExtractor(this)).map(element => {
            var record = this._fieldExtractor(element);
            if (element[this._idSymbol]) {
                record[this._idSymbol] = element[this._idSymbol];
            } else {
                var uuid = crypto.randomUUID();
                element[this._idSymbol] = uuid;
                record[this._idSymbol] = uuid;
            }
            record[this._elementSymbol] = element;
            return record;
        });
        
        
    }

    render () {
        throw new Error("not implemented");
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
        this.#records = this.readFromHtml();
    }

}

class CustomTable2 extends CustomTable {
    constructor () {
        super(["custNm", "age", "hasCar", "status"]);
    }

    _recordExtractor (customElement) {
        return Array.from(customElement.querySelectorAll("tbody tr"));
    }
    _fieldExtractor (recordElement, hasId) {
        var obj = {
            custNm:findValueFrom(recordElement, "[name=custNm]"),
            age:findValueFrom(recordElement, "[name=age]"),
            hasCar:findValueFrom(recordElement, "[name^=hasCar][checked]"),
            status:findValueFrom(recordElement, "[name=status]"),
            [this._elementSymbol]: recordElement
        }
        if (!hasId) obj[this._idSymbol] = crypto.randomUUID();

        return obj;
    }

    render () {
        var template = document.querySelector("#row-template").content;
        this.records.forEach((record, index) => {
            var clone = template.cloneNode(true);
            for (var prop in record) {
                var fields = Array.from(clone.querySelectorAll(`[data-name=${prop}]`));
                fields.forEach(f => {
                    if (f.tagName === "INPUT" && (f.type === "radio" || f.type === "checkbox")) {
                        f.name = `${prop}_${index}`;
                        if(f.value === record[prop]) f.checked = true;
                    } else {
                        f.name = prop;
                        f.value = record[prop];
                    }
                })
            }

            record[this._elementSymbol].replaceWith(clone);
        });
    }
}

customElements.define("custom-table", CustomTable2);