import { InlineLoader } from '@/components/loader';

/** Sits in the page column only — the sidebar stays put while the next screen compiles. */
const AppLoading = () => <InlineLoader label="Loading" />;

export default AppLoading;
