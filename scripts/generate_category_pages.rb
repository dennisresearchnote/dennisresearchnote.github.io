# frozen_string_literal: true

require "fileutils"
require "yaml"
require "date"

ROOT = File.expand_path("..", __dir__)
POSTS_DIR = File.join(ROOT, "_posts")
BLOG_DIR = File.join(ROOT, "blog")

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

def write_page(path, content)
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, content, mode: "w", encoding: "utf-8")
end

# blog/index.html은 건드리지 않음
# 자동 생성 대상은 blog/<top>/index.html, blog/<top>/<sub>/index.html
# 기존 자동 생성 결과만 정리
Dir.glob(File.join(BLOG_DIR, "*", "index.html")).each do |path|
  File.delete(path) if File.file?(path)
end

Dir.glob(File.join(BLOG_DIR, "*", "*", "index.html")).each do |path|
  File.delete(path) if File.file?(path)
end

Dir.glob(File.join(BLOG_DIR, "*")).each do |path|
  next unless File.directory?(path)
  next if File.basename(path).start_with?(".")
  next if File.basename(path) == "assets"

  # 비어 있는 하위 디렉터리 정리
  Dir.glob(File.join(path, "*")).each do |subpath|
    FileUtils.rm_rf(subpath) if File.directory?(subpath) && Dir.empty?(subpath)
  end

  FileUtils.rm_rf(path) if Dir.empty?(path)
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
  category_tree[top] << sub if sub && !sub.empty? && !category_tree[top].include?(sub)
end

category_tree.keys.sort.each do |top|
  top_page = <<~HTML
    ---
    layout: category
    title: #{top}
    category_name: #{top}
    permalink: /blog/#{top}/
    ---
  HTML

  write_page(File.join(BLOG_DIR, top, "index.html"), top_page)

  category_tree[top].compact.sort.each do |sub|
    sub_page = <<~HTML
      ---
      layout: category
      title: #{sub}
      category_name: #{top}
      subcategory_name: #{sub}
      permalink: /blog/#{top}/#{sub}/
      ---
    HTML

    write_page(File.join(BLOG_DIR, top, sub, "index.html"), sub_page)
  end
end

puts "Generated category pages:"
category_tree.keys.sort.each do |top|
  puts "  /blog/#{top}/"
  category_tree[top].compact.sort.each do |sub|
    puts "  /blog/#{top}/#{sub}/"
  end
end