import Component from 'ShopUi/models/component';
import AutocompleteForm, {Events as AutocompleteEvents} from 'ShopUi/components/molecules/autocomplete-form/autocomplete-form';
import AjaxProvider from 'ShopUi/components/molecules/ajax-provider/ajax-provider';
import debounce from 'lodash-es/debounce';

export default class QuickOrderRow extends Component {
    ajaxProvider: AjaxProvider;
    autocompleteInput: AutocompleteForm;
    quantityInput: HTMLInputElement;
    incrementButton: HTMLButtonElement;
    decrementButton: HTMLButtonElement;

    protected readyCallback(): void {
        this.ajaxProvider = <AjaxProvider>this.getElementsByClassName(`${this.jsName}__provider`)[0];
        this.autocompleteInput = <AutocompleteForm>this.getElementsByClassName(this.autocompleteFormClassName)[0];
        this.registerQuantityInput();
        this.mapEvents();
    }

    protected registerQuantityInput(): void {
        this.incrementButton = <HTMLButtonElement>(this.getElementsByClassName(`${this.jsName}__button-increment`)[0] ||
            this.getElementsByClassName(`${this.jsName}-partial__button-increment`)[0]);
        this.decrementButton = <HTMLButtonElement>(this.getElementsByClassName(`${this.jsName}__button-decrement`)[0] ||
            this.getElementsByClassName(`${this.jsName}-partial__button-decrement`)[0]);
        this.quantityInput = <HTMLInputElement>(this.getElementsByClassName(`${this.jsName}__quantity`)[0] ||
            this.getElementsByClassName(`${this.jsName}-partial__quantity`)[0]);
    }

    protected mapEvents(): void {
        this.autocompleteInput.addEventListener(AutocompleteEvents.SET, () => this.onAutocompleteSet());
        this.autocompleteInput.addEventListener(AutocompleteEvents.UNSET, () => this.onAutocompleteUnset());
        this.mapQuantityInputChange();
    }

    protected mapQuantityInputChange(): void {
        this.incrementButton.addEventListener('click', (event: Event) => this.incrementValue(event));
        this.decrementButton.addEventListener('click', (event: Event) => this.decrementValue(event));
        this.quantityInput.addEventListener('input', debounce(() => {
            this.onQuantityChange();
        }, this.autocompleteInput.debounceDelay));
    }

    protected onAutocompleteSet(): void {
        this.reloadField(this.autocompleteInput.inputValue);
    }

    protected onAutocompleteUnset(): void {
        this.reloadField();
    }

    protected onQuantityChange(): void {
        this.reloadField(this.autocompleteInput.inputValue);
    }

    protected incrementValue(event: Event): void {
        event.preventDefault();
        const value = Number(this.quantityInput.value);
        const potentialValue = value + this.step;
        if (value < this.maxQuantity) {
            this.quantityInput.value = potentialValue.toString();
            this.onQuantityChange();
        }
    }

    protected decrementValue(event: Event): void {
        event.preventDefault();
        const value = Number(this.quantityInput.value);
        const potentialValue = value - this.step;
        if (potentialValue >= this.minQuantity) {
            this.quantityInput.value = potentialValue.toString();
            this.onQuantityChange();
        }
    }

    async reloadField(sku: string = '') {
        const quantityInputValue = parseInt(this.quantityValue);

        this.ajaxProvider.queryParams.set('sku', sku);
        this.ajaxProvider.queryParams.set('index', this.ajaxProvider.getAttribute('class').split('-').pop().trim());

        if (!!quantityInputValue) {
            this.ajaxProvider.queryParams.set('quantity', `${quantityInputValue}`);
        }

        await this.ajaxProvider.fetch();
        this.registerQuantityInput();
        this.mapQuantityInputChange();

        if (!!sku) {
            this.quantityInput.focus();
        }
    }

    protected get quantityValue(): string {
        return this.quantityInput.value;
    }

    protected get autocompleteFormClassName(): string {
        return this.getAttribute('autocomplete-form-class-name');
    }

    protected get minQuantity(): number {
        return Number(this.quantityInput.getAttribute('min'));
    }

    protected get maxQuantity(): number {
        const max = Number(this.quantityInput.getAttribute('max'));

        return max > 0 && max > this.minQuantity ? max : Infinity;
    }

    protected get step(): number {
        const step = Number(this.quantityInput.getAttribute('step'));

        return step > 0 ? step : 1;
    }
}
