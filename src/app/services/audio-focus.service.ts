import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoggerService } from './logger.service';

type ReleaseHandler = () => void;

@Injectable({
    providedIn: 'root',
})
export class AudioFocusService {
    private readonly releaseHandlers = new Map<string, ReleaseHandler>();
    private readonly activeOwnerSubject = new BehaviorSubject<string | null>(null);

    readonly activeOwner$ = this.activeOwnerSubject.asObservable();

    private logger = inject(LoggerService);

    registerOwner(ownerId: string, onRelease: ReleaseHandler): void {
        this.releaseHandlers.set(ownerId, onRelease);
    }

    unregisterOwner(ownerId: string): void {
        this.releaseHandlers.delete(ownerId);
        if (this.activeOwnerSubject.value === ownerId) {
            this.activeOwnerSubject.next(null);
        }
    }

    requestFocus(ownerId: string): void {
        const activeOwner = this.activeOwnerSubject.value;

        if (activeOwner && activeOwner !== ownerId) {
            const activeOwnerRelease = this.releaseHandlers.get(activeOwner);
            try {
                activeOwnerRelease?.();
            } catch (error) {
                this.logger.error(`AudioFocusService: failed to release owner "${activeOwner}"`, error);
            }
        }

        if (this.activeOwnerSubject.value !== ownerId) {
            this.activeOwnerSubject.next(ownerId);
        }
    }

    releaseFocus(ownerId: string): void {
        if (this.activeOwnerSubject.value === ownerId) {
            this.activeOwnerSubject.next(null);
        }
    }

    get activeOwner(): string | null {
        return this.activeOwnerSubject.value;
    }
}
