<template>
<li>
    <label
        v-if="branchHasChanged"
        for="branch"
        class="changed"
        v-on:click="reload"
        v-on:keyup.enter="reload"
    >
        {{ $t('BRANCH.REFRESH_REQUIRED') }}
    </label>
    <label v-else for="branch">{{ $t('BRANCH.PREFERRED') }}</label>
    <div class="select">
        <select id="branch" v-model="branch">
            <option
                v-for="branchName in branchOptions"
                :key="branchName"
                :value="branchName"
            >
                {{ branchName }}
            </option>
        </select>
    </div>
</li>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { Storage } from '@tv/shared'

export default defineComponent({
    data() {
        const branches = Object.keys(window.tv.manifest.branches)
        let defaultBranch = 'main'

        if (branches.includes('** hmr **')) defaultBranch = '** hmr **'
        else if (branches.includes('** dist **')) defaultBranch = '** dist **'

        return {
            branch: Storage.get('preference:branch') || defaultBranch,
            branchHasChanged: false
        }
    },

    computed: {
        branchOptions() {
            return Object.keys(window.tv.manifest.branches)
        }
    },

    watch: {
        branch(newValue: string, oldValue: string) {
            if (oldValue && oldValue !== newValue) {
                Storage.set('preference:branch', newValue)
                this.branchHasChanged = true
            }
        }
    },

    methods: {
        reload() {
            window.location.reload()
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.nav {
    label {
        margin-top: 5px;
        width: auto;
        border-radius: 5px;
        font-size: 12px;
        color: jbg.$white;

        &.changed {
            background-color: jbg.$white;
            color: #ce4949;
            cursor: pointer;
        }
    }

    .select {
        position: relative;
        display: block;
        width: 210px;
        margin: 0 auto 10px;
        border-radius: 14px;
        border: 2px solid jbg.$white;

        &::after {
            color: jbg.$white;
        }
    }

    select {
        margin: 0;
        border: transparent;
        background-color: transparent;
        font-size: 15px;
        text-align: center;
        color: jbg.$white;
    }
}
</style>
