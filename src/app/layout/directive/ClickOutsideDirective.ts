import {Directive, ElementRef, EventEmitter, HostListener, Output} from '@angular/core';

@Directive({
    selector: '[clickOutside]',
    standalone: true,
})
export class ClickOutsideDirective {
    @Output() clickOutside=new EventEmitter<void>();

    constructor(private elementRef: ElementRef) {
    }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        const targetElement=event.target as HTMLElement;
        if(targetElement) {
            const clickedInside=this.elementRef.nativeElement.contains(targetElement);
            if(!clickedInside) {
                this.clickOutside.emit();
            }
        }
    }
}
