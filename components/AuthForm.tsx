"use client";

import authBackground from "@/assets_organizados_wilderfeast/05_ilustracoes_cenas/145.jpg";
import { AuthUser, getApiErrorMessage, login, register } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const brandIcon = "data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjM3LjUiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNy41IDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iSWNvbiIgZD0iTTcuNSA1MFYyNy4xMjVDNS4zNzUgMjYuNTQxNyAzLjU5Mzc1IDI1LjM3NSAyLjE1NjI1IDIzLjYyNUMwLjcxODc1IDIxLjg3NSAwIDE5LjgzMzMgMCAxNy41VjBINVYxNy41SDcuNVYwSDEyLjVWMTcuNUgxNVYwSDIwVjE3LjVDMjAgMTkuODMzMyAxOS4yODEyIDIxLjg3NSAxNy44NDM4IDIzLjYyNUMxNi40MDYyIDI1LjM3NSAxNC42MjUgMjYuNTQxNyAxMi41IDI3LjEyNVY1MEg3LjVWNTBNMzIuNSA1MFYzMEgyNVYxMi41QzI1IDkuMDQxNjcgMjYuMjE4OCA2LjA5Mzc1IDI4LjY1NjIgMy42NTYyNUMzMS4wOTM4IDEuMjE4NzUgMzQuMDQxNyAwIDM3LjUgMFY1MEgzMi41VjUwIiBmaWxsPSIjRkZCODY2Ii8+Cjwvc3ZnPgo=";
const nameIcon = "data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjQgMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJNYXJnaW4iPgo8cGF0aCBpZD0iSWNvbiIgZD0iTTE2IDE2QzE1LjA2NjcgMTYgMTQuMTc1IDE2LjE0NTggMTMuMzI1IDE2LjQzNzVDMTIuNDc1IDE2LjcyOTIgMTEuNyAxNy4xNjY3IDExIDE3Ljc1VjE3Ljc1QzExIDE3Ljc4MzMgMTEgMTcuODI1IDExIDE3Ljg3NUMxMSAxNy45MjUgMTEgMTcuOTY2NyAxMSAxOEgyMUMyMSAxNy45NjY3IDIxIDE3LjkyNSAyMSAxNy44NzVDMjEgMTcuODI1IDIxIDE3Ljc4MzMgMjEgMTcuNzVWMTcuNzVDMjAuMyAxNy4xNjY3IDE5LjUyNSAxNi43MjkyIDE4LjY3NSAxNi40Mzc1QzE3LjgyNSAxNi4xNDU4IDE2LjkzMzMgMTYgMTYgMTZWMTZNMTYgMTRDMTcuMTUgMTQgMTguMjI1IDE0LjE3NSAxOS4yMjUgMTQuNTI1QzIwLjIyNSAxNC44NzUgMjEuMTUgMTUuMzY2NyAyMiAxNlYyVjJWMkgxMFYyVjJWMTZDMTAuODUgMTUuMzY2NyAxMS43NzUgMTQuODc1IDEyLjc3NSAxNC41MjVDMTMuNzc1IDE0LjE3NSAxNC44NSAxNCAxNiAxNFYxNE0xNiAxMEMxNS41ODMzIDEwIDE1LjIyOTIgOS44NTQxNyAxNC45Mzc1IDkuNTYyNUMxNC42NDU4IDkuMjcwODMgMTQuNSA4LjkxNjY3IDE0LjUgOC41QzE0LjUgOC4wODMzMyAxNC42NDU4IDcuNzI5MTcgMTQuOTM3NSA3LjQzNzVDMTUuMjI5MiA3LjE0NTgzIDE1LjU4MzMgNyAxNiA3QzE2LjQxNjcgNyAxNi43NzA4IDcuMTQ1ODMgMTcuMDYyNSA3LjQzNzVDMTcuMzU0MiA3LjcyOTE3IDE3LjUgOC4wODMzMyAxNy41IDguNUMxNy41IDguOTE2NjcgMTcuMzU0MiA5LjI3MDgzIDE3LjA2MjUgOS41NjI1QzE2Ljc3MDggOS44NTQxNyAxNi40MTY3IDEwIDE2IDEwVjEwTTEwIDIwQzkuNDUgMjAgOC45NzkxNyAxOS44MDQyIDguNTg3NSAxOS40MTI1QzguMTk1ODMgMTkuMDIwOCA4IDE4LjU1IDggMThWMkM4IDEuNDUgOC4xOTU4MyAwLjk3OTE2NyA4LjU4NzUgMC41ODc1QzguOTc5MTcgMC4xOTU4MzMgOS40NSAwIDEwIDBIMjJDMjIuNTUgMCAyMy4wMjA4IDAuMTk1ODMzIDIzLjQxMjUgMC41ODc1QzIzLjgwNDIgMC45NzkxNjcgMjQgMS40NSAyNCAyVjE4QzI0IDE4LjU1IDIzLjgwNDIgMTkuMDIwOCAyMy40MTI1IDE5LjQxMjVDMjMuMDIwOCAxOS44MDQyIDIyLjU1IDIwIDIyIDIwSDEwVjIwTTE2IDEyQzE2Ljk2NjcgMTIgMTcuNzkxNyAxMS42NTgzIDE4LjQ3NSAxMC45NzVDMTkuMTU4MyAxMC4yOTE3IDE5LjUgOS40NjY2NyAxOS41IDguNUMxOS41IDcuNTMzMzMgMTkuMTU4MyA2LjcwODMzIDE4LjQ3NSA2LjAyNUMxNy43OTE3IDUuMzQxNjcgMTYuOTY2NyA1IDE2IDVDMTUuMDMzMyA1IDE0LjIwODMgNS4zNDE2NyAxMy41MjUgNi4wMjVDMTIuODQxNyA2LjcwODMzIDEyLjUgNy41MzMzMyAxMi41IDguNUMxMi41IDkuNDY2NjcgMTIuODQxNyAxMC4yOTE3IDEzLjUyNSAxMC45NzVDMTQuMjA4MyAxMS42NTgzIDE1LjAzMzMgMTIgMTYgMTJWMTJNMTYgOC41VjguNVY4LjVWOC41VjguNVY4LjVWOC41VjguNVY4LjVWOC41VjguNVY4LjVWOC41IiBmaWxsPSIjOEU5MDk5Ii8+CjwvZz4KPC9zdmc+Cg==";
const passwordIcon = "data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjMxIiBoZWlnaHQ9IjEyIiB2aWV3Qm94PSIwIDAgMzEgMTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJNYXJnaW4iPgo8cGF0aCBpZD0iSWNvbiIgZD0iTTE0IDhDMTMuNDUgOCAxMi45NzkyIDcuODA0MTcgMTIuNTg3NSA3LjQxMjVDMTIuMTk1OCA3LjAyMDgzIDEyIDYuNTUgMTIgNkMxMiA1LjQ1IDEyLjE5NTggNC45NzkxNyAxMi41ODc1IDQuNTg3NUMxMi45NzkyIDQuMTk1ODMgMTMuNDUgNCAxNCA0QzE0LjU1IDQgMTUuMDIwOCA0LjE5NTgzIDE1LjQxMjUgNC41ODc1QzE1LjgwNDIgNC45NzkxNyAxNiA1LjQ1IDE2IDZDMTYgNi41NSAxNS44MDQyIDcuMDIwODMgMTUuNDEyNSA3LjQxMjVDMTUuMDIwOCA3LjgwNDE3IDE0LjU1IDggMTQgOFY4TTE0IDEyQzEyLjMzMzMgMTIgMTAuOTE2NyAxMS40MTY3IDkuNzUgMTAuMjVDOC41ODMzMyA5LjA4MzMzIDggNy42NjY2NyA4IDZDOCA0LjMzMzMzIDguNTgzMzMgMi45MTY2NyA5Ljc1IDEuNzVDMTAuOTE2NyAwLjU4MzMzMyAxMi4zMzMzIDAgMTQgMEMxNS4xMTY3IDAgMTYuMTI5MiAwLjI3NSAxNy4wMzc1IDAuODI1QzE3Ljk0NTggMS4zNzUgMTguNjY2NyAyLjEgMTkuMiAzSDI4TDMxIDZMMjYuNSAxMC41TDI0LjUgOUwyMi41IDEwLjVMMjAuMzc1IDlIMTkuMkMxOC42NjY3IDkuOSAxNy45NDU4IDEwLjYyNSAxNy4wMzc1IDExLjE3NUMxNi4xMjkyIDExLjcyNSAxNS4xMTY3IDEyIDE0IDEyVjEyTTE0IDEwQzE0LjkzMzMgMTAgMTUuNzU0MiA5LjcxNjY3IDE2LjQ2MjUgOS4xNUMxNy4xNzA4IDguNTgzMzMgMTcuNjQxNyA3Ljg2NjY3IDE3Ljg3NSA3SDIxTDIyLjQ1IDguMDI1TDI0LjUgNi41TDI2LjI3NSA3Ljg3NUwyOC4xNSA2TDI3LjE1IDVIMTcuODc1QzE3LjY0MTcgNC4xMzMzMyAxNy4xNzA4IDMuNDE2NjcgMTYuNDYyNSAyLjg1QzE1Ljc1NDIgMi4yODMzMyAxNC45MzMzIDIgMTQgMkMxMi45IDIgMTEuOTU4MyAyLjM5MTY3IDExLjE3NSAzLjE3NUMxMC4zOTE3IDMuOTU4MzMgMTAgNC45IDEwIDZDMTAgNy4xIDEwLjM5MTcgOC4wNDE2NyAxMS4xNzUgOC44MjVDMTEuOTU4MyA5LjYwODMzIDEyLjkgMTAgMTQgMTBWMTAiIGZpbGw9IiM4RTkwOTkiLz4KPC9nPgo8L3N2Zz4K";
const flameIcon = "data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE5IiB2aWV3Qm94PSIwIDAgMTYgMTkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJDb250YWluZXIiPgo8cGF0aCBpZD0iSWNvbiIgZD0iTTIgMTFDMiAxMS44NjY3IDIuMTc1IDEyLjY4NzUgMi41MjUgMTMuNDYyNUMyLjg3NSAxNC4yMzc1IDMuMzc1IDE0LjkxNjcgNC4wMjUgMTUuNUM0LjAwODMzIDE1LjQxNjcgNCAxNS4zNDE3IDQgMTUuMjc1QzQgMTUuMjA4MyA0IDE1LjEzMzMgNCAxNS4wNUM0IDE0LjUxNjcgNC4xIDE0LjAxNjcgNC4zIDEzLjU1QzQuNSAxMy4wODMzIDQuNzkxNjcgMTIuNjU4MyA1LjE3NSAxMi4yNzVMOCA5LjVMMTAuODI1IDEyLjI3NUMxMS4yMDgzIDEyLjY1ODMgMTEuNSAxMy4wODMzIDExLjcgMTMuNTVDMTEuOSAxNC4wMTY3IDEyIDE0LjUxNjcgMTIgMTUuMDVDMTIgMTUuMTMzMyAxMiAxNS4yMDgzIDEyIDE1LjI3NUMxMiAxNS4zNDE3IDExLjk5MTcgMTUuNDE2NyAxMS45NzUgMTUuNUMxMi42MjUgMTQuOTE2NyAxMy4xMjUgMTQuMjM3NSAxMy40NzUgMTMuNDYyNUMxMy44MjUgMTIuNjg3NSAxNCAxMS44NjY3IDE0IDExQzE0IDEwLjE2NjcgMTMuODQ1OCA5LjM3OTE3IDEzLjUzNzUgOC42Mzc1QzEzLjIyOTIgNy44OTU4MyAxMi43ODMzIDcuMjMzMzMgMTIuMiA2LjY1VjYuNjVDMTEuODY2NyA2Ljg2NjY3IDExLjUxNjcgNy4wMjkxNyAxMS4xNSA3LjEzNzVDMTAuNzgzMyA3LjI0NTgzIDEwLjQwODMgNy4zIDEwLjAyNSA3LjNDOC45OTE2NyA3LjMgOC4wOTU4MyA2Ljk1ODMzIDcuMzM3NSA2LjI3NUM2LjU3OTE3IDUuNTkxNjcgNi4xNDE2NyA0Ljc1IDYuMDI1IDMuNzVWMy43NUM1LjM3NSA0LjMgNC44IDQuODcwODMgNC4zIDUuNDYyNUMzLjggNi4wNTQxNyAzLjM3OTE3IDYuNjU0MTcgMy4wMzc1IDcuMjYyNUMyLjY5NTgzIDcuODcwODMgMi40Mzc1IDguNDkxNjcgMi4yNjI1IDkuMTI1QzIuMDg3NSA5Ljc1ODMzIDIgMTAuMzgzMyAyIDExVjExTTggMTIuM0w2LjU3NSAxMy43QzYuMzkxNjcgMTMuODgzMyA2LjI1IDE0LjA5MTcgNi4xNSAxNC4zMjVDNi4wNSAxNC41NTgzIDYgMTQuOCA2IDE1LjA1QzYgMTUuNTgzMyA2LjE5NTgzIDE2LjA0MTcgNi41ODc1IDE2LjQyNUM2Ljk3OTE3IDE2LjgwODMgNy40NSAxNyA4IDE3QzguNTUgMTcgOS4wMjA4MyAxNi44MDgzIDkuNDEyNSAxNi40MjVDOS44MDQxNyAxNi4wNDE3IDEwIDE1LjU4MzMgMTAgMTUuMDVDMTAgMTQuNzgzMyA5Ljk1IDE0LjUzNzUgOS44NSAxNC4zMTI1QzkuNzUgMTQuMDg3NSA5LjYwODMzIDEzLjg4MzMgOS40MjUgMTMuN0w4IDEyLjNWMTIuM004IDBWMy4zQzggMy44NjY2NyA4LjE5NTgzIDQuMzQxNjcgOC41ODc1IDQuNzI1QzguOTc5MTcgNS4xMDgzMyA5LjQ1ODMzIDUuMyAxMC4wMjUgNS4zQzEwLjMyNSA1LjMgMTAuNjA0MiA1LjIzNzUgMTAuODYyNSA1LjExMjVDMTEuMTIwOCA0Ljk4NzUgMTEuMzUgNC44IDExLjU1IDQuNTVMMTIgNEMxMy4yMzMzIDQuNyAxNC4yMDgzIDUuNjc1IDE0LjkyNSA2LjkyNUMxNS42NDE3IDguMTc1IDE2IDkuNTMzMzMgMTYgMTFDMTYgMTMuMjMzMyAxNS4yMjUgMTUuMTI1IDEzLjY3NSAxNi42NzVDMTIuMTI1IDE4LjIyNSAxMC4yMzMzIDE5IDggMTlDNS43NjY2NyAxOSAzLjg3NSAxOC4yMjUgMi4zMjUgMTYuNjc1QzAuNzc1IDE1LjEyNSAwIDEzLjIzMzMgMCAxMUMwIDguODUgMC43MjA4MzMgNi44MDgzMyAyLjE2MjUgNC44NzVDMy42MDQxNyAyLjk0MTY3IDUuNTUgMS4zMTY2NyA4IDBWMCIgZmlsbD0iIzg2QTBDRCIvPgo8L2c+Cjwvc3ZnPgo=";
const registerIcon = "data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjEwLjUiIGhlaWdodD0iOS4zMzMzMyIgdmlld0JveD0iMCAwIDEwLjUgOS4zMzMzMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9IkNvbnRhaW5lciI+CjxwYXRoIGlkPSJJY29uIiBkPSJNMS4xNjY2NyA5LjMzMzMzQzAuODQ1ODMzIDkuMzMzMzMgMC41NzExODEgOS4yMTkxIDAuMzQyNzA4IDguOTkwNjNDMC4xMTQyMzYgOC43NjIxNSAwIDguNDg3NSAwIDguMTY2NjdDMCA3Ljg0NTgzIDAuMTE0MjM2IDcuNTcxMTggMC4zNDI3MDggNy4zNDI3MUMwLjU3MTE4MSA3LjExNDI0IDAuODQ1ODMzIDcgMS4xNjY2NyA3QzEuNDg3NSA3IDEuNzYyMTUgNy4xMTQyNCAxLjk5MDYzIDcuMzQyNzFDMi4yMTkxIDcuNTcxMTggMi4zMzMzMyA3Ljg0NTgzIDIuMzMzMzMgOC4xNjY2N0MyLjMzMzMzIDguNDg3NSAyLjIxOTEgOC43NjIxNSAxLjk5MDYzIDguOTkwNjNDMS43NjIxNSA5LjIxOTEgMS40ODc1IDkuMzMzMzMgMS4xNjY2NyA5LjMzMzMzVjkuMzMzMzNNMS4xNjY2NyA1LjgzMzMzQzAuODQ1ODMzIDUuODMzMzMgMC41NzExODEgNS43MTkxIDAuMzQyNzA4IDUuNDkwNjJDMC4xMTQyMzYgNS4yNjIxNSAwIDQuOTg3NSAwIDQuNjY2NjdDMCA0LjM0NTgzIDAuMTE0MjM2IDQuMDcxMTggMC4zNDI3MDggMy44NDI3MUMwLjU3MTE4MSAzLjYxNDI0IDAuODQ1ODMzIDMuNSAxLjE2NjY3IDMuNUMxLjQ4NzUgMy41IDEuNzYyMTUgMy42MTQyNCAxLjk5MDYzIDMuODQyNzFDMi4yMTkxIDQuMDcxMTggMi4zMzMzMyA0LjM0NTgzIDIuMzMzMzMgNC42NjY2N0MyLjMzMzMzIDQuOTg3NSAyLjIxOTEgNS4yNjIxNSAxLjk5MDYzIDUuNDkwNjJDMS43NjIxNSA1LjcxOTEgMS40ODc1IDUuODMzMzMgMS4xNjY2NyA1LjgzMzMzVjUuODMzMzNNMS4xNjY2NyAyLjMzMzMzQzAuODQ1ODMzIDIuMzMzMzMgMC41NzExODEgMi4yMTkxIDAuMzQyNzA4IDEuOTkwNjNDMC4xMTQyMzYgMS43NjIxNSAwIDEuNDg3NSAwIDEuMTY2NjdDMCAwLjg0NTgzMyAwLjExNDIzNiAwLjU3MTE4MSAwLjM0MjcwOCAwLjM0MjcwOEMwLjU3MTE4MSAwLjExNDIzNiAwLjg0NTgzMyAwIDEuMTY2NjcgMEMxLjQ4NzUgMCAxLjc2MjE1IDAuMTE0MjM2IDEuOTkwNjMgMC4zNDI3MDhDMi4yMTkxIDAuNTcxMTgxIDIuMzMzMzMgMC44NDU4MzMgMi4zMzMzMyAxLjE2NjY3QzIuMzMzMzMgMS40ODc1IDIuMjE5MSAxLjc2MjE1IDEuOTkwNjMgMS45OTA2M0MxLjc2MjE1IDIuMjE5MSAxLjQ4NzUgMi4zMzMzMyAxLjE2NjY3IDIuMzMzMzNWMi4zMzMzM000LjY2NjY3IDIuMzMzMzNDNC4zNDU4MyAyLjMzMzMzIDQuMDcxMTggMi4yMTkxIDMuODQyNzEgMS45OTA2M0MzLjYxNDI0IDEuNzYyMTUgMy41IDEuNDg3NSAzLjUgMS4xNjY2N0MzLjUgMC44NDU4MzMgMy42MTQyNCAwLjU3MTE4MSAzLjg0MjcxIDAuMzQyNzA4QzQuMDcxMTggMC4xMTQyMzYgNC4zNDU4MyAwIDQuNjY2NjcgMEM0Ljk4NzUgMCA1LjI2MjE1IDAuMTE0MjM2IDUuNDkwNjIgMC4zNDI3MDhDNS43MTkxIDAuNTcxMTgxIDUuODMzMzMgMC44NDU4MzMgNS44MzMzMyAxLjE2NjY3QzUuODMzMzMgMS40ODc1IDUuNzE5MSAxLjc2MjE1IDUuNDkwNjIgMS45OTA2M0M1LjI2MjE1IDIuMjE5MSA0Ljk4NzUgMi4zMzMzMyA0LjY2NjY3IDIuMzMzMzNWMi4zMzMzM004LjE2NjY3IDIuMzMzMzNDNy44NDU4MyAyLjMzMzMzIDcuNTcxMTggMi4yMTkxIDcuMzQyNzEgMS45OTA2M0M3LjExNDI0IDEuNzYyMTUgNyAxLjQ4NzUgNyAxLjE2NjY3QzcgMC44NDU4MzMgNy4xMTQyNCAwLjU3MTE4MSA3LjM0MjcxIDAuMzQyNzA4QzcuNTcxMTggMC4xMTQyMzYgNy44NDU4MyAwIDguMTY2NjcgMEM4LjQ4NzUgMCA4Ljc2MjE1IDAuMTE0MjM2IDguOTkwNjMgMC4zNDI3MDhDOS4yMTkxIDAuNTcxMTgxIDkuMzMzMzMgMC44NDU4MzMgOS4zMzMzMyAxLjE2NjY3QzkuMzMzMzMgMS40ODc1IDkuMjE5MSAxLjc2MjE1IDguOTkwNjMgMS45OTA2M0M4Ljc2MjE1IDIuMjE5MSA4LjQ4NzUgMi4zMzMzMyA4LjE2NjY3IDIuMzMzMzNWMi4zMzMzM000LjY2NjY3IDUuODMzMzNDNC4zNDU4MyA1LjgzMzMzIDQuMDcxMTggNS43MTkxIDMuODQyNzEgNS40OTA2MkMzLjYxNDI0IDUuMjYyMTUgMy41IDQuOTg3NSAzLjUgNC42NjY2N0MzLjUgNC4zNDU4MyAzLjYxNDI0IDQuMDcxMTggMy44NDI3MSAzLjg0MjcxQzQuMDcxMTggMy42MTQyNCA0LjM0NTgzIDMuNSA0LjY2NjY3IDMuNUM0Ljk4NzUgMy41IDUuMjYyMTUgMy42MTQyNCA1LjQ5MDYyIDMuODQyNzFDNS43MTkxIDQuMDcxMTggNS44MzMzMyA0LjM0NTgzIDUuODMzMzMgNC42NjY2N0M1LjgzMzMzIDQuOTg3NSA1LjcxOTEgNS4yNjIxNSA1LjQ5MDYyIDUuNDkwNjJDNS4yNjIxNSA1LjcxOTEgNC45ODc1IDUuODMzMzMgNC42NjY2NyA1LjgzMzMzVjUuODMzMzNNNS4yNSA5LjMzMzMzVjcuNTM5NThMOC40NzI5MiA0LjMzMTI1QzguNTYwNDIgNC4yNDM3NSA4LjY1NzY0IDQuMTgwNTYgOC43NjQ1OCA0LjE0MTY3QzguODcxNTMgNC4xMDI3OCA4Ljk3ODQ3IDQuMDgzMzMgOS4wODU0MiA0LjA4MzMzQzkuMjAyMDggNC4wODMzMyA5LjMxMzg5IDQuMTA1MjEgOS40MjA4MyA0LjE0ODk2QzkuNTI3NzggNC4xOTI3MSA5LjYyNSA0LjI1ODMzIDkuNzEyNSA0LjM0NTgzTDEwLjI1MjEgNC44ODU0MkMxMC4zMjk5IDQuOTcyOTIgMTAuMzkwNiA1LjA3MDE0IDEwLjQzNDQgNS4xNzcwOEMxMC40NzgxIDUuMjg0MDMgMTAuNSA1LjM5MDk3IDEwLjUgNS40OTc5MkMxMC41IDUuNjA0ODYgMTAuNDgwNiA1LjcxNDI0IDEwLjQ0MTcgNS44MjYwNEMxMC40MDI4IDUuOTM3ODUgMTAuMzM5NiA2LjAzNzUgMTAuMjUyMSA2LjEyNUw3LjA0Mzc1IDkuMzMzMzNINS4yNVY5LjMzMzMzTTkuNjI1IDUuNDk3OTJWNS40OTc5Mkw5LjA4NTQyIDQuOTU4MzNWNC45NTgzM0w5LjYyNSA1LjQ5NzkyVjUuNDk3OTJNNi4xMjUgOC40NTgzM0g2LjY3OTE3TDguNDQzNzUgNi42NzkxN0w4LjE4MTI1IDYuNDAyMDhMNy45MDQxNyA2LjEzOTU4TDYuMTI1IDcuOTA0MTdWOC40NTgzM1Y4LjQ1ODMzTTguMTgxMjUgNi40MDIwOEw3LjkwNDE3IDYuMTM5NThWNi4xMzk1OEw4LjQ0Mzc1IDYuNjc5MTdWNi42NzkxN0w4LjE4MTI1IDYuNDAyMDhWNi40MDIwOCIgZmlsbD0iI0FEQzdGNyIvPgo8L2c+Cjwvc3ZnPgo=";

function normalizeIdentity(value: string) {
  const trimmed = value.trim();

  if (trimmed.includes("@")) {
    return trimmed;
  }

  const alias = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

  return `${alias || "feral"}@jogadores.wilderfeast.com`;
}

export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const identity = signup ? nome : email;

  useEffect(() => {
    if (signup) {
      return;
    }

    const rememberedIdentity = localStorage.getItem("wilderfeast_identity");
    if (rememberedIdentity) {
      setEmail(rememberedIdentity);
      setLembrar(true);
    }
  }, [signup]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!identity.trim() || !senha) {
      setErro(
        signup ? "Dados de cadastro incompletos." : "Credenciais incompletas.",
      );
      return;
    }

    try {
      setEnviando(true);
      const normalizedEmail = normalizeIdentity(identity);
      let usuario: AuthUser;

      if (signup) {
        usuario = await register({
          email: normalizedEmail,
          nome: nome.trim(),
          senha,
        });
      } else {
        usuario = { email: normalizedEmail, id: 0 };
      }

      const resposta = await login({ email: normalizedEmail, senha });
      usuario.id = resposta.usuario_id;
      usuario.nome ??= identity.includes("@")
        ? identity.split("@")[0]
        : identity.trim();

      localStorage.setItem("wilderfeast_user", JSON.stringify(usuario));
      if (lembrar) {
        localStorage.setItem("wilderfeast_identity", identity.trim());
      } else {
        localStorage.removeItem("wilderfeast_identity");
      }

      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.push(
        nextPath?.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/",
      );
      router.refresh();
    } catch (error) {
      setErro(
        getApiErrorMessage(
          error,
          signup
            ? "Não foi possível concluir o cadastro."
            : "Credenciais inválidas.",
        ),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main
      className="auth-page"
      style={{ backgroundImage: `url(${authBackground.src})` }}
    >
      <div className="auth-page-overlay" aria-hidden="true" />

      <div className="auth-main">
        <header className="auth-hero">
          <img className="auth-mark" src={brandIcon} alt="" />
          <h1>WILDERFEAST HUB</h1>
          <p>Crônicas do Caçador-Cozinheiro</p>
        </header>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-heading">
              <h2>{signup ? "Registro do Feral" : "Login do Feral"}</h2>
              <span>REF. DE ENTRADA 001</span>
            </div>

            <form noValidate onSubmit={submit}>
              <label className="auth-field">
                <span>Nome</span>
                <span className="auth-input-row">
                  <input
                    autoComplete={signup ? "username" : "email"}
                    onChange={(event) =>
                      signup
                        ? setNome(event.target.value)
                        : setEmail(event.target.value)
                    }
                    placeholder="Digite seu apelido..."
                    required
                    type="text"
                    value={identity}
                  />
                  <img src={nameIcon} alt="" />
                </span>
              </label>

              <label className="auth-field">
                <span>Senha</span>
                <span className="auth-input-row auth-password-row">
                  <input
                    autoComplete={signup ? "new-password" : "current-password"}
                    minLength={6}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Digite sua senha..."
                    required
                    type="password"
                    value={senha}
                  />
                  <img src={passwordIcon} alt="" />
                </span>
              </label>

              <div className="auth-options">
                <label className="auth-remember">
                  <input
                    checked={lembrar}
                    onChange={(event) => setLembrar(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Lembrar de mim</span>
                </label>
                <Link href="/login">Esqueceu a senha?</Link>
              </div>

              {erro && (
                <p className="auth-error" role="alert">
                  {erro}
                </p>
              )}

              <div className="auth-actions">
                <button className="auth-primary" disabled={enviando} type="submit">
                  <span>
                    {enviando ? "AGUARDE..." : signup ? "CADASTRAR" : "ENTRAR"}
                  </span>
                  {!enviando && <img src={flameIcon} alt="" />}
                </button>

                <div className="auth-divider">
                  <span>OU</span>
                </div>

                <Link
                  className="auth-secondary"
                  href={signup ? "/login" : "/cadastro"}
                >
                  <img src={registerIcon} alt="" />
                  <span>{signup ? "ENTRAR" : "CADASTRAR NOVO FERAL"}</span>
                </Link>
              </div>
            </form>
          </div>
        </section>

        <footer></footer>
      </div>
    </main>
  );
}
