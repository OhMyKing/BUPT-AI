import yaml


class Config:
    def __init__(self, filename):
        with open(filename, 'r') as file:
            self.config = yaml.safe_load(file)

    def __getattr__(self, item):
        return self.config[item]

    def __getitem__(self, item):
        parts = item.split('.')
        current = self.config
        for part in parts:
            current = current[part]
        return current

    def to_flask_config(self, app):
        for key, value in self.config.items():
            app.config[key] = value