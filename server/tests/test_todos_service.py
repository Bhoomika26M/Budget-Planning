from src.entities import Todo


def test_todo_defaults_to_incomplete():
    todo = Todo(title='Review monthly budget')

    assert todo.title == 'Review monthly budget'
    assert Todo.__table__.c.completed.default.arg is False