# frozen_string_literal: true

require "fileutils"
require "yaml"

ROOT = File.expand_path("..", __dir__)
POSTS_DIR = File.join(ROOT, "_posts")
BLOG_DIR = File.join(ROOT, "blog")
AUTO_DIR = File.join(BLOG_DIR, "_auto")

FileUtils.rm_rf(AUTO_DIR)
FileUtils.mkdir_p(AUTO_DIR)

def extract_front_matter(path)
  content = File.read(path, encoding: "utf-8")
  return {} unless content.start_with?("---")

  parts = content.split(/^---\s*$\n?/, 3)
  return {} if parts.length < 3

  YAML.safe_load(parts[1], permitted_classes: [Date, Time], aliases: true) || {}
rescue StandardError => e
  warn "Failed to parse front matter: #{path} (#{e.message})"
  {}
end

def normalize_categories(raw_categories)
  case raw_categories
  when Array
    raw_categories.map(&:to_s).map(&:strip).reject(&:empty?)
  when String
    raw_categories.split(",").map(&:strip).reject(&:empty?)
  else
    []
  end
end

posts = Dir.glob(File.join(POSTS_DIR, "*.{md,markdown,html}"))

category_tree = {}

posts.each do |post_path|
  data = extract_front_matter(post_path)
  categories = normalize_categories(data["categories"])
  next if categories.empty?

  top = categories[0]
  sub = categories[1]

  category_tree[top] ||= []
  category_tree[top] << sub if sub && !category_tree[top].include?(sub)
end

category_tree.each do |top, subs|
  top_dir = File.join(AUTO_DIR, top)
  FileUtils.mkdir_p(top_dir)

  top_page = <<~HTML
    ---
    layout: category
    title: #{top}
    category_name: #{top}
    permalink: /blog/#{top}/
    ---
  HTML

  File.write(File.join(top_dir, "index.html"), top_page, mode: "w", encoding: "utf-8")

  subs.compact.sort.each do |sub|
    sub_dir = File.join(top_dir, sub)
    FileUtils.mkdir_p(sub_dir)

    sub_page = <<~HTML
      ---
      layout: category
      title: #{sub}
      category_name: #{top}
      subcategory_name: #{sub}
      permalink: /blog/#{top}/#{sub}/
      ---
    HTML

    File.write(File.join(sub_dir, "index.html"), sub_page, mode: "w", encoding: "utf-8")
  end
end

puts "Generated category pages under #{AUTO_DIR}"