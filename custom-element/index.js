const findValueFrom = function (scope, selector, defaultValue) {
    var input = scope.querySelector(selector);
    return input?.value || defaultValue;
}

class CustomTable extends HTMLElement {
    
    #records = [];
    #changeListeners = [];
    constructor (model = {}) {
        super();
        var _model = {
            addChangeListener: (listener) => {
                this.#changeListeners.push(listener);
                return () => {
                    this.#changeListeners = this.#changeListeners.filter(l => l !== listener);
                }
            },
            // test code. not going to be exposed.
            invokeListeners : () => {
                var records = this.records;
                this.#changeListeners.forEach(l => l(records));
            }
        };

        _model = Object.assign(_model, model);
        Object.defineProperty(this, "model", {
            value: Object.freeze(_model),
            writable: false,
            configurable: false,
            iterable: true,
        });
    }
    
    _extractRecord (customElement) {
        throw new Error("not implemented");
    }
    _convertHtmlElementToRecord (recordElement) {
        throw new Error("not implemented");
    }
    
    _idSymbol = Symbol("id");
    // _elementSymbol = Symbol("element");

    #readFromHtml () {
        return Array.from(this._extractRecord(this))
        .map(element => {
            var record = this._convertHtmlElementToRecord(element);
            var uuid = crypto.randomUUID();
            element[this._idSymbol] = uuid;
            record[this._idSymbol] = uuid;
            // record[this._elementSymbol] = element;
            return record;
        });
        
        
    }


    get records () {
        return this.#records.slice();
    }

    connectedCallback () {
        this.#records = this.#readFromHtml();
    }

}

class CustomTable2 extends CustomTable {
    #template = null;
    #fieldNames = null;
    constructor () {
        super({
            test: ()  => {
                console.log(this.records);
                this.model.invokeListeners();
            }
        });
        // ["custNm", "age", "hasCar", "status"]
        this.#template = document.querySelector("template");
        this.#fieldNames = {
            custNm:(recordElement) => findValueFrom(recordElement, "[name=custNm]"),
            age:(recordElement) => findValueFrom(recordElement, "[name=age]"),
            hasCar:(recordElement) => findValueFrom(recordElement, "[name^=hasCar][checked]"),
            status:(recordElement) => findValueFrom(recordElement, "[name=status]", "00")
        }
        this.model.addChangeListener(
            (records) => records.forEach((r, index) => this.#render(r[this._idSymbol], index, r))
        );
    }

    _convertHtmlElementToRecord (recordElement) {
        return Object.entries(this.#fieldNames).reduce((acc, cur) => {
            acc[cur[0]] = cur[1](recordElement);
            return acc;
        }, {});
    }
    _extractRecord (customElement) {
        return Array.from(customElement.querySelectorAll("tbody tr"));
    }
    

    #render (id, index, recordData) {
        
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
        
        this._extractRecord(this).filter(r => r[this._idSymbol] === id).forEach(r => {
            clone.querySelector("tr")[this._idSymbol] = id;
            r.replaceWith(clone);
        });
    }
}

customElements.define("custom-table", CustomTable2);