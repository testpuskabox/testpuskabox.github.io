<template>
<div class="jbg password">
    <img class="image" src="../images/password.png" alt="Enter Password">
    <h3 class="text">{{ $t('FORM.PASSWORD_REQUIRED_TITLE') }}</h3>
    <p class="subtext">{{ $t('FORM.PASSWORD_REQUIRED_BODY') }}</p>

    <div class="actions">
        <input
            ref="input"
            type="text"
            :value="password"
            :placeholder="$t('FORM.PASSWORD_PLACEHOLDER')"
            :maxlength="passwordLength"
            autocapitalize="off"
            autocorrect="off"
            autocomplete="off"
            aria-label="password"
            v-on:input="onInput"
        >
        <button
            type="submit"
            :disabled="!canSubmit"
            v-on:click.prevent="$emit('resolve', password)"
        >
            {{ $t('FORM.PASSWORD_JOIN_AS_PLAYER') }}
        </button>

        <template v-if="room!.audienceEnabled">
            <hr>
            <p class="or">{{ $t('SEPARATOR.OR') }}</p>
            <button
                v-bb="$t('FORM.PASSWORD_JOIN_AS_AUDIENCE')"
                class="audience"
                type="submit"
                v-on:click.prevent="$emit('resolve', true)"
            />
        </template>

        <button
            v-else
            class="cancel"
            v-on:click.prevent="$emit('resolve', false)"
        >
            {{ $t('ACTION.CANCEL') }}
        </button>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { GetRoomReply } from '@jackboxgames/ecast'

export default defineComponent({
    props: {
        room: Object as Prop<GetRoomReply>
    },

    emits: ['resolve'],

    data() {
        return {
            passwordLength: 5,
            password: ''
        }
    },

    computed: {
        canSubmit(): boolean {
            return this.password.length >= this.passwordLength
        }
    },

    mounted() {
        const inputEl = this.$refs.input as HTMLInputElement
        inputEl.focus()
    },

    methods: {
        onInput(event: Event) {
            const target = event.target as HTMLInputElement
            this.password = target.value.toUpperCase()
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.actions {
    button {
        line-height: 1;
    }

    input::placeholder {
        position: absolute;
        top: 50%;
        left: 5px;
        right: 5px;
        white-space: pre-line;
        transform: translateY(-50%);
    }
}

.or {
    position: relative;
    display: inline-block;
    margin: 12px 0 0;
    padding: 0 8px;
    font-size: 14px;
    text-align: center;
    background: #fff;
}

.text {
    line-height: 1.25;
}

hr {
    position: relative;
    top: 22px;
    border-bottom: 1px solid jbg.$gray;
}
</style>
