import {api} from './main'
import {api as search} from './search'

declare global {
    interface Window {
        TD: typeof api,
        SC: typeof search
    }
}
