<template>
<div class="jbg fatal">
    <div class="constrain">
        <a class="logo" href="/" aria-label="Jackbox Games Logo" />

        <div class="content">
            <h1>You have encountered an error</h1>
            <p>Something went wrong! But don't worry, you can try a few things to get going.</p>
            <ul>
                <li>Refresh the page</li>
                <li>Turn off adblockers or other browser extensions.</li>
                <li>Check your connection to the Internet.</li>
                <li>Make sure you're using an up-to-date browser.</li>
                <li>If that doesn't work, let us know.</li>
            </ul>
            <button v-on:click="onFeedbackClick">Tell us what happened</button>
            <hr>
            <pre class="error">{{ message }}</pre>
        </div>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent, inject } from 'vue'
import { showReportDialog } from '@sentry/browser'
import { InjectionKeys } from '../../InjectionKeys'

export default defineComponent({
    // Typesafe injections are only available in the composition api
    setup() {
        return {
            fatalError: inject(InjectionKeys.fatal.error)
        }
    },

    computed: {
        message(): string {
            const id = this.fatalError?.event?.event_id ?? 'Unknown'
            let message = ''

            const exception = this.fatalError?.hint?.originalException
            if (!exception) message = 'An unknown error occured'
            else if (typeof exception === 'string') message = exception
            else message = exception.message

            return `Version:\n${window.tv.manifest.loader.version}\n\nEvent ID:\n${id}\n\n${message}`
        }
    },

    methods: {
        onFeedbackClick() {
            showReportDialog({
                id: this.fatalError?.event?.event_id ?? 'Unknown'
            })
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.fatal {
    height: 100%;
    font-size: 14px;
    overflow-y: scroll;
    font-family: jbg.$helvetica;
    font-weight: bold;
    color: jbg.$grayDark;
}

.logo {
    display: block;
    width: 100%;
    padding-top: 37.7778%;
    background-image: url('./error-header.png');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top center;
}

.content {
    padding: 0 20px 20px;
}

h1 {
    margin: 15px 0;
    padding-top: 20px;
    border-top: 1px solid #999;
    font-size: 2em;
    line-height: 1;
}

ul {
    margin: 15px 0;
    padding: 15px 20px 15px 40px;
    background: jbg.$offWhite;
    border: 1px solid #999;
    border-radius: 10px;
    list-style-position: outside;
}

hr {
    margin: 15px 0 25px;
    border-top: 1px solid #999;
}

.error {
    margin: 10px 0;
    padding: 15px 20px;
    font-size: 12px;
    border: 1px solid #999;
    border-radius: 10px;
    white-space: pre-wrap;
}

:global(.sentry-error-embed-wrapper) {
    padding: 20px;
}
</style>
