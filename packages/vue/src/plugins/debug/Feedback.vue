<template>
<!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
<div class="feedback-button" v-on:click="onFeedbackClick">SEND FEEDBACK</div>
</template>


<script lang="ts">
import { Component, defineComponent } from 'vue'
import SendModal from './SendModal.vue'

export default defineComponent({
    methods: {
        onFeedbackClick() {
            void this.$showModal<{ options: 'feedback' | 'debug' }>(SendModal as Component)
        }
    }
})
</script>


<style lang="scss" scoped>
.feedback-button {
    cursor: pointer;
    position: fixed;
    bottom: -1px;
    left: 50%;
    width: 150px;
    height: 20px;
    margin-left: -75px;
    border: 1px solid #666;
    border-radius: 10px 10px 0 0;
    background: rgba(50, 50, 50, 0.5);
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    font-size: 12px;
    text-align: center;
    text-shadow:
        -1px -1px 0 #999,
        1px -1px 0 #999,
        -1px 1px 0 #999,
        1px 1px 0 #999;
    transition: bottom 0.25s;
    z-index: 999999;
}
</style>
