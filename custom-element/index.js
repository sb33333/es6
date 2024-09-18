const findValueFrom = function (scope, selector) {
    var input = scope.querySelector(selector);
    return input?.value;
}

class CustomTable extends HTMLElement {
    
    #records = [];
    constructor () {
        super();
        // if (!Array.isArray(fieldNames)) throw new Error("fieldNames must be an Array");
        // this.#fieldNames = fieldNames;
    }
    
    _recordExtractor (customElement) {
        throw new Error("not implemented");
    }
    _convertHtmlElementToRecord (recordElement) {
        throw new Error("not implemented");
    }
    
    _idSymbol = Symbol("id");
    _elementSymbol = Symbol("element");

    readFromHtml () {
        return Array.from(this._recordExtractor(this))
        .map(element => {
            var record = this._convertHtmlElementToRecord(element);
            var uuid = crypto.randomUUID();
            element[this._idSymbol] = uuid;
            record[this._idSymbol] = uuid;
            // record[this._elementSymbol] = element;
            return record;
        });
        
        
    }

    render (id, record) {
        throw new Error("not implemented");
    }

    get records () {
        return this.#records.slice();
    }

    connectedCallback () {
        this.#records = this.readFromHtml();
    }

}

class CustomTable2 extends CustomTable {
    #template = null;
    #fieldNames = null;
    constructor () {
        super();
        // ["custNm", "age", "hasCar", "status"]
        this.#template = document.querySelector("template");
        this.#fieldNames = {
            custNm:(recordElement) => findValueFrom(recordElement, "[name=custNm]"),
        }
    }

    #fieldNames = {};
    _convertHtmlElementToRecord (recordElement) {
        return Object.entries(this.#fieldNames).reduce((acc, cur) => {
            acc[cur[0]] = cur[1](recordElement);
            return acc;
        }, {});
    }
    _recordExtractor (customElement) {
        return Array.from(customElement.querySelectorAll("tbody tr"));
    }
    

    renew () {
        this.records.forEach((r, index) => this.render(r[this._idSymbol], index, r));
    }
    render (id, index, recordData) {
        
        var clone = this.#template.cloneNode(true).content;
        for (var prop in recordData) {
            var fields = Array.from(clone.querySelectorAll(`[data-name=${prop}]`));
            fields.forEach(f => {
                if (f.tagName === "INPUT" && (f.type === "radio" || f.type === "checkbox")) {
                    f.name = `${prop}_${index}`;
                    if(f.value === recordData[prop]) f.checked = true;
                } else {
                    f.name = prop;
                    f.value = recordData[prop];
                }
            });
        }
        console.log(Array.from(clone.querySelectorAll("[name^=hasCar]")).map(f=>f.checked));
        this._recordExtractor(this).filter(r => r[this._idSymbol] === id).forEach(r => {
            clone.querySelector("tr")[this._idSymbol] = id;
            r.replaceWith(clone);
            console.log(r);
        });
        
        
    }
}

customElements.define("custom-table", CustomTable2);