import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./startup/startup.module').then(m => m.StartupPageModule)
    },
    {
        path: 'tabs',
        loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
    },
    {
        path: 'tab1',
        loadChildren: () => import('./tab1/tab1.module').then(m => m.Tab1PageModule)
    },
    {
        path: 'startup',
        loadChildren: () => import('./startup/startup.module').then(m => m.StartupPageModule)
    },
    {
        path: 'startup-language',
        loadChildren: () => import('./startup-language/startup-language.module').then(m => m.StartupLanguagePageModule)
    },
    {
        path: 'addnotes',
        loadChildren: () => import('./addnotes/addnotes.module').then(m => m.AddnotesPageModule)
    },
    {
        path: 'startup-default-bible',
        loadChildren: () => import('./startup-default-bible/startup-default-bible.module').then(m => m.StartupDefaultBiblePageModule)
    },
    {
        path: 'getstarted',
        loadChildren: () => import('./getstarted/getstarted.module').then(m => m.GetstartedPageModule)
    },
    {
        path: 'tabslink',
        loadChildren: () => import('./tabslink/tabslink.module').then(m => m.TabslinkPageModule)
    },
    {
        path: 'home',
        loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
    },
    {
        path: 'read/:counter',
        loadChildren: () => import('./read/read.module').then(m => m.ReadPageModule)
    },
    {
        path: 'compare',
        loadChildren: () => import('./compare/compare.module').then(m => m.ComparePageModule)
    },
    {
        path: 'bookselector',
        loadChildren: () => import('./bookselector/bookselector.module').then(m => m.BookselectorPageModule)
    },
    {
        path: 'forgot-password',
        loadChildren: () => import('./forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule)
    },
    {
        path: 'change-password',
        loadChildren: () => import('./change-password/change-password.module').then(m => m.ChangePasswordPageModule)
    },
    {
        path: 'login',
        loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: 'myaccount',
        loadChildren: () => import('./myaccount/myaccount.module').then(m => m.MyaccountPageModule)
    },
    {
        path: 'signup',
        loadChildren: () => import('./signup/signup.module').then(m => m.SignupPageModule)
    },
    {
        path: 'readmarklist/:counter',
        loadChildren: () => import('./readmarklist/readmarklist.module').then(m => m.ReadmarklistPageModule)
    },
    {
        path: 'setdefaultbible',
        loadChildren: () => import('./setdefaultbible/setdefaultbible.module').then(m => m.SetdefaultbiblePageModule)
    },
    {
        path: 'search',
        loadChildren: () => import('./search/search.module').then(m => m.SearchPageModule)
    },
    {
        path: 'more',
        loadChildren: () => import('./more/more.module').then(m => m.MorePageModule)
    },
    {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule)
    },
    {
        path: 'more-terms',
        loadChildren: () => import('./more-terms/more-terms.module').then(m => m.MoreTermsPageModule)
    },
    {
        path: 'more-about',
        loadChildren: () => import('./more-about/more-about.module').then(m => m.MoreAboutPageModule)
    },
    {
        path: 'more-contact',
        loadChildren: () => import('./more-contact/more-contact.module').then(m => m.MoreContactPageModule)
    },
    {
        path: 'more-reportbug',
        loadChildren: () => import('./more-reportbug/more-reportbug.module').then(m => m.MoreReportbugPageModule)
    },
    {
        path: 'more-volunteer',
        loadChildren: () => import('./more-volunteer/more-volunteer.module').then(m => m.MoreVolunteerPageModule)
    },
    {
        path: 'more-private-policy',
        loadChildren: () => import('./more-private-policy/more-private-policy.module').then(m => m.MorePrivatePolicyPageModule)
    },
    {
        path: 'bible-topics',
        loadChildren: () => import('./bible-topics/bible-topics.module').then(m => m.BibleTopicsPageModule)
    },
    {
        path: 'bible-topics/:id',
        loadChildren: () => import('./bible-topic-detail/bible-topic-detail.module').then(m => m.BibleTopicDetailPageModule)
    },
    {
        path: 'life-events',
        loadChildren: () => import('./life-events/life-events.module').then(m => m.LifeEventsPageModule)
    },
    {
        path: 'life-events/:id',
        loadChildren: () => import('./life-event-detail/life-event-detail.module').then(m => m.LifeEventDetailPageModule)
    },
];
