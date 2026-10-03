import type { ReactNode } from 'react'

export interface Field {
  key: string
  label: string
  type:
    | 'text'
    | 'textarea'
    | 'image'
    | 'number'
    | 'switch'
    | 'select'
    | 'select-ref'
    | 'year-ref'
    | 'works-multiselect'
  options?: { value: string; label: string }[]
  ref?: string
  refLabel?: (item: any) => string
  placeholder?: string
  default?: boolean
}

export interface ColConfig {
  name: string
  title: string
  titleKey?: string
  fields: Field[]
  columnsHeader: string[]
  columns: (item: any) => (ReactNode | string)[]
  emptyText?: string
}

const statusLabel = (s?: string) =>
  s === 'ongoing' ? '展出中' : s === 'upcoming' ? '即将开幕' : s === 'ended' ? '已结束' : s || '—'

const typeLabel = (t?: string) =>
  t === 'event' ? '活动' : t === 'notice' ? '通知' : t === 'news' ? '资讯' : t || '—'

export const THEMES: ColConfig = {
  name: 'themes',
  title: '主题',
  titleKey: 'name',
  fields: [
    { key: 'name', label: '主题名称', type: 'text' },
    { key: 'description', label: '描述', type: 'textarea' },
    { key: 'coverImage', label: '封面图', type: 'image' },
    { key: 'order', label: '排序', type: 'number', placeholder: '数字越小越靠前' },
  ],
  columnsHeader: ['名称', '描述'],
  columns: (d) => [d.name, (d.description || '').slice(0, 40)],
}

export const CATEGORIES: ColConfig = {
  name: 'categories',
  title: '分类',
  titleKey: 'name',
  fields: [
    { key: 'name', label: '分类名称', type: 'text' },
    { key: 'description', label: '描述', type: 'textarea' },
    { key: 'order', label: '排序', type: 'number' },
  ],
  columnsHeader: ['名称', '描述'],
  columns: (d) => [d.name, (d.description || '').slice(0, 40)],
}

export const PHOTOGRAPHERS: ColConfig = {
  name: 'photographers',
  title: '摄影师',
  titleKey: 'name',
  fields: [
    { key: 'name', label: '姓名', type: 'text' },
    { key: 'bio', label: '简介', type: 'textarea' },
    { key: 'avatar', label: '头像', type: 'image' },
    { key: 'website', label: '个人网站', type: 'text', placeholder: 'https://' },
    { key: 'order', label: '排序', type: 'number' },
  ],
  columnsHeader: ['头像', '姓名', '简介'],
  columns: (d) => [
    d.avatar ? (
      <img src={d.avatar} className="h-8 w-8 rounded-full object-cover" alt="" />
    ) : (
      '—'
    ),
    d.name,
    (d.bio || '').slice(0, 30),
  ],
}

export const YEARS: ColConfig = {
  name: 'years',
  title: '作品年份',
  titleKey: 'year',
  fields: [
    { key: 'year', label: '年份', type: 'number' },
    { key: 'description', label: '说明', type: 'textarea' },
  ],
  columnsHeader: ['年份', '说明'],
  columns: (d) => [d.year, d.description || ''],
}

export const WORKS: ColConfig = {
  name: 'works',
  title: '作品',
  titleKey: 'title',
  fields: [
    { key: 'title', label: '作品标题', type: 'text' },
    { key: 'description', label: '描述', type: 'textarea' },
    { key: 'image', label: '作品图片', type: 'image' },
    { key: 'themeId', label: '主题', type: 'select-ref', ref: 'themes' },
    {
      key: 'categoryId',
      label: '分类',
      type: 'select-ref',
      ref: 'categories',
    },
    {
      key: 'photographerId',
      label: '摄影师',
      type: 'select-ref',
      ref: 'photographers',
    },
    { key: 'year', label: '年份', type: 'year-ref' },
    { key: 'location', label: '拍摄地点', type: 'text' },
    { key: 'camera', label: '器材', type: 'text' },
    { key: 'featured', label: '设为精选', type: 'switch', default: false },
    { key: 'published', label: '公开发布', type: 'switch', default: true },
  ],
  columnsHeader: ['图片', '标题', '摄影师', '主题', '分类', '状态'],
  columns: (d) => [
    d.image ? (
      <img src={d.image} className="h-12 w-16 rounded object-cover" alt="" />
    ) : (
      '—'
    ),
    d.title,
    d._photographerId || '—',
    d._themeId || '—',
    d._categoryId || '—',
    d.published ? '已发布' : '草稿',
  ],
}

export const EXHIBITIONS: ColConfig = {
  name: 'exhibitions',
  title: '展览',
  titleKey: 'title',
  fields: [
    { key: 'title', label: '展览标题', type: 'text' },
    { key: 'subtitle', label: '副标题', type: 'text' },
    { key: 'description', label: '展览介绍', type: 'textarea' },
    { key: 'coverImage', label: '封面图', type: 'image' },
    { key: 'startDate', label: '开始日期', type: 'text', placeholder: 'YYYY-MM-DD' },
    { key: 'endDate', label: '结束日期', type: 'text', placeholder: 'YYYY-MM-DD' },
    { key: 'location', label: '地点', type: 'text' },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      options: [
        { value: 'upcoming', label: '即将开幕' },
        { value: 'ongoing', label: '展出中' },
        { value: 'ended', label: '已结束' },
      ],
    },
    { key: 'curator', label: '策展人', type: 'text' },
    { key: 'workIds', label: '包含作品', type: 'works-multiselect' },
    { key: 'published', label: '公开发布', type: 'switch', default: true },
  ],
  columnsHeader: ['封面', '标题', '状态', '发布'],
  columns: (d) => [
    d.coverImage ? (
      <img src={d.coverImage} className="h-12 w-16 rounded object-cover" alt="" />
    ) : (
      '—'
    ),
    d.title,
    statusLabel(d.status),
    d.published ? '已发布' : '草稿',
  ],
}

export const ANNOUNCEMENTS: ColConfig = {
  name: 'announcements',
  title: '公告与活动',
  titleKey: 'title',
  fields: [
    { key: 'title', label: '标题', type: 'text' },
    { key: 'body', label: '正文', type: 'textarea' },
    { key: 'image', label: '活动海报', type: 'image' },
    {
      key: 'type',
      label: '类型',
      type: 'select',
      options: [
        { value: 'event', label: '活动' },
        { value: 'notice', label: '通知' },
        { value: 'news', label: '资讯' },
      ],
    },
    { key: 'pinned', label: '置顶', type: 'switch', default: false },
    { key: 'published', label: '公开发布', type: 'switch', default: true },
  ],
  columnsHeader: ['标题', '类型', '置顶', '发布'],
  columns: (d) => [
    d.title,
    typeLabel(d.type),
    d.pinned ? '是' : '否',
    d.published ? '已发布' : '草稿',
  ],
}
